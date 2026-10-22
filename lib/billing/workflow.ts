import { checkVatNumber } from "@/lib/be-vat";
import type { Seller } from "@/config/company";
import type { StoredRequest } from "@/lib/requests/store";
import { create, newId, nextSequence, replace } from "@/lib/storage";
import { computeTotals, PricingNotConfiguredError } from "./totals";
import type { BillingParty, CatalogItem, Invoice, Quote, QuoteLine, QuoteStatus, VatRate } from "./types";

export type BillingDeps = { catalog: CatalogItem[]; vatRates: VatRate[]; seller: Seller };

/* ---------- Devis ---------- */

/** Construit un devis à partir d'une demande et de lignes choisies dans le catalogue. Refuse si rien n'est configuré. */
export function buildQuote(request: StoredRequest, lines: { itemId: string; quantity: number }[], deps: Pick<BillingDeps, "catalog" | "vatRates">, now = new Date()): Quote {
  if (deps.catalog.length === 0) throw new PricingNotConfiguredError("Le catalogue de prestations est vide : définissez vos prix dans config/pricing.ts.");
  const quoteLines: QuoteLine[] = lines.map((l) => {
    const item = deps.catalog.find((c) => c.id === l.itemId);
    if (!item) throw new PricingNotConfiguredError(`Prestation inconnue « ${l.itemId} ».`);
    // Instantané : modifier le catalogue plus tard ne change pas un devis déjà établi.
    return { itemId: item.id, label: item.label, unit: item.unit, quantity: l.quantity, unitPriceCents: item.unitPriceCents, vatRateId: item.vatRateId };
  });
  computeTotals(quoteLines, deps.vatRates); // valide prix, quantités et TVA
  return { id: newId("QUO", now), kind: "quote", requestId: request.id, status: "draft", lines: quoteLines, createdAt: now.toISOString() };
}

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "declined", "expired"],
  accepted: [],
  declined: [],
  expired: [],
};

export function transitionQuote(quote: Quote, to: QuoteStatus, now = new Date(), validDays = 30): Quote {
  if (!TRANSITIONS[quote.status].includes(to)) throw new Error(`Transition de devis interdite : ${quote.status} → ${to}.`);
  const at = now.toISOString();
  const next: Quote = { ...quote, status: to };
  if (to === "sent") {
    next.sentAt = at;
    next.validUntil = new Date(now.getTime() + validDays * 86_400_000).toISOString();
  }
  if (to === "accepted") {
    if (quote.validUntil && now > new Date(quote.validUntil)) throw new Error("Ce devis a expiré : il ne peut plus être accepté.");
    next.acceptedAt = at;
  }
  if (to === "declined") next.declinedAt = at;
  return next;
}

/* ---------- Facture définitive ---------- */

export function buyerFromRequest(request: StoredRequest): BillingParty {
  const d = request.data;
  if (d.profile === "societe") {
    return { name: d.companyName, vatNumber: d.vatNumber, street: d.billingStreet, postalCode: d.billingPostalCode, city: d.billingCity, country: d.billingCountry };
  }
  return { name: `${d.firstName} ${d.lastName}`, street: d.street, postalCode: d.postalCode, city: d.city, country: "Belgique" };
}

/**
 * Liste TOUT ce qui empêche d'émettre une facture définitive. Une liste vide signifie que l'émission est permise.
 * Rien n'est supposé : un prix, une règle de TVA ou une information légale manquante bloque.
 */
export function invoiceBlockers(quote: Quote, request: StoredRequest, deps: BillingDeps): string[] {
  const b: string[] = [];
  if (quote.status !== "accepted") b.push(`Le devis n'est pas accepté (statut : ${quote.status}).`);
  if (quote.invoiceId) b.push(`Ce devis a déjà donné lieu à la facture ${quote.invoiceId}.`);
  if (quote.requestId !== request.id) b.push("Le devis ne correspond pas à cette demande.");

  const s = deps.seller;
  const missing = (Object.entries({
    "nom légal": s.legalName,
    "adresse": s.street,
    "code postal": s.postalCode,
    "ville": s.city,
    "numéro de TVA / d'entreprise": s.vatNumber,
  }) as [string, string][])
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
  if (missing.length) b.push(`Identité du vendeur incomplète (config/company.ts, variables COMPANY_*) : ${missing.join(", ")}.`);
  else if (!checkVatNumber(s.vatNumber).ok) b.push("Le numéro de TVA du vendeur est invalide.");

  const buyer = buyerFromRequest(request);
  if (!buyer.name.trim() || !buyer.street.trim() || !buyer.postalCode.trim() || !buyer.city.trim()) b.push("Informations de facturation du client incomplètes.");
  if (request.data.profile === "societe" && !buyer.vatNumber) b.push("Numéro d'entreprise du client manquant.");

  if (deps.vatRates.length === 0) b.push("Aucune règle de TVA n'est configurée (config/vat.ts).");
  if (deps.catalog.length === 0) b.push("Aucun prix n'est configuré (config/pricing.ts).");
  if (quote.lines.length === 0) b.push("Le devis ne contient aucune ligne.");
  else if (deps.vatRates.length > 0) {
    try {
      computeTotals(quote.lines, deps.vatRates);
    } catch (e) {
      b.push(e instanceof Error ? e.message : "Totaux impossibles à calculer.");
    }
  }
  return b;
}

export class InvoiceBlockedError extends Error {
  constructor(public blockers: string[]) {
    super(`Facture impossible : ${blockers.join(" ")}`);
    this.name = "InvoiceBlockedError";
  }
}

/** Émet la facture définitive d'un devis accepté. Numéro séquentiel sans trou ; refuse tant qu'un bloqueur subsiste. */
export async function issueInvoice(quote: Quote, request: StoredRequest, deps: BillingDeps, now = new Date()): Promise<{ invoice: Invoice; quote: Quote }> {
  const blockers = invoiceBlockers(quote, request, deps);
  if (blockers.length) throw new InvoiceBlockedError(blockers);

  const year = now.getUTCFullYear();
  const n = await nextSequence("invoice", year);
  const invoice: Invoice = {
    id: newId("FAC", now),
    kind: "invoice",
    number: `${year}-${String(n).padStart(4, "0")}`,
    quoteId: quote.id,
    requestId: request.id,
    issuedAt: now.toISOString(),
    seller: deps.seller,
    buyer: buyerFromRequest(request),
    lines: quote.lines,
    totals: computeTotals(quote.lines, deps.vatRates),
  };
  await create("invoices", invoice);
  const linked: Quote = { ...quote, invoiceId: invoice.id };
  await replace("quotes", linked);
  return { invoice, quote: linked };
}
