import { z } from "zod";
import { checkVatNumber } from "@/lib/be-vat";
import type { Seller } from "@/config/company";
import { buildQuoteHeader } from "./header";
import type { StoredRequest } from "@/lib/requests/store";
import { create, newId, nextSequence, replace } from "@/lib/storage";
import { computeTotals, lineProblems } from "./totals";
import type { BillingParty, CatalogItem, Invoice, Quote, QuoteStatus, StrictLine, VatRate } from "./types";

export type BillingDeps = { catalog: CatalogItem[]; vatRates: VatRate[]; seller: Seller };

/* ---------- Devis ---------- */

/** Un brouillon prérempli avec les informations du questionnaire. Aucun prix n'est inventé : il reste à saisir. */
export function createDraftQuote(request: StoredRequest, opts: { validDays?: number; quoteTerms?: string } = {}, now = new Date()): Quote {
  const h = buildQuoteHeader(request);
  return {
    id: newId("QUO", now),
    kind: "quote",
    requestId: request.id,
    status: "draft",
    subject: h.subject,
    notes: "",
    validDays: opts.validDays ?? 30,
    lines: [{ label: h.firstLine.label, description: h.firstLine.description, unit: "forfait", quantity: 1, unitPriceCents: null, vatRateId: null }],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    quoteTerms: opts.quoteTerms ?? "",
  };
}

const lineInput = z.object({
  itemId: z.string().max(60).optional(),
  label: z.string().trim().max(200),
  description: z.string().trim().max(500).optional(),
  unit: z.string().trim().max(20),
  quantity: z.number().finite().gt(0, "Quantité invalide.").max(1_000_000).multipleOf(0.001),
  unitPriceCents: z.number().int().min(0).max(100_000_000).nullable(),
  vatRateId: z.string().max(40).nullable(),
});

export const draftPatchSchema = z.object({
  subject: z.string().trim().max(300),
  notes: z.string().trim().max(2000),
  validDays: z.number().int().min(1, "Au moins 1 jour.").max(365, "Au plus 365 jours."),
  lines: z.array(lineInput).max(50, "Trop de lignes."),
});

export type DraftPatch = z.infer<typeof draftPatchSchema>;

/** Met à jour un brouillon. Un devis émis est figé : on ne le modifie plus (on le duplique). */
export async function updateDraft(quote: Quote, patch: DraftPatch, now = new Date()): Promise<Quote> {
  if (quote.status !== "draft") throw new Error("Ce devis est émis : il n'est plus modifiable. Dupliquez-le pour en faire une nouvelle version.");
  return replace("quotes", { ...quote, ...patch, updatedAt: now.toISOString() });
}

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: [],
  sent: ["accepted", "declined", "expired"],
  accepted: [],
  declined: [],
  expired: [],
};

/** Transitions APRÈS émission (le passage brouillon vers émis se fait par issueQuote, qui contrôle tout). */
export function transitionQuote(quote: Quote, to: QuoteStatus, now = new Date()): Quote {
  if (!TRANSITIONS[quote.status].includes(to)) throw new Error(`Transition de devis interdite : ${quote.status} → ${to}.`);
  const at = now.toISOString();
  const next: Quote = { ...quote, status: to, updatedAt: at };
  if (to === "accepted") {
    if (quote.validUntil && now > new Date(quote.validUntil)) throw new Error("Ce devis a expiré : il ne peut plus être accepté.");
    next.acceptedAt = at;
  }
  if (to === "declined") next.declinedAt = at;
  if (to === "expired") next.expiredAt = at;
  return next;
}

export function buyerFromRequest(request: StoredRequest): BillingParty {
  const d = request.data;
  if (d.profile === "societe") {
    return {
      name: d.companyName,
      vatNumber: d.vatNumber,
      street: d.billingStreet,
      postalCode: d.billingPostalCode,
      city: d.billingCity,
      country: d.billingCountry,
      contact: `${d.contactFirstName} ${d.contactLastName}`,
    };
  }
  return { name: `${d.firstName} ${d.lastName}`, street: d.street, postalCode: d.postalCode, city: d.city, country: "Belgique" };
}

/**
 * Tout ce qui empêche d'ÉMETTRE ce devis (et donc de générer son PDF définitif). Liste vide = émission permise.
 * Rien n'est supposé : un prix, une règle de TVA ou une information légale manquante bloque.
 */
export function quoteBlockers(quote: Quote, request: StoredRequest, deps: Pick<BillingDeps, "vatRates" | "seller">): string[] {
  const b: string[] = [];
  if (quote.requestId !== request.id) b.push("Le devis ne correspond pas à cette demande.");

  const s = deps.seller;
  const missing = (
    Object.entries({ "nom légal": s.legalName, adresse: s.street, "code postal": s.postalCode, ville: s.city, "numéro de TVA / d'entreprise": s.vatNumber }) as [string, string][]
  )
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
  if (missing.length) b.push(`Informations de votre entreprise incomplètes (page « Entreprise ») : ${missing.join(", ")}.`);
  else if (!checkVatNumber(s.vatNumber).ok) b.push("Le numéro de TVA de votre entreprise est invalide.");

  const buyer = buyerFromRequest(request);
  if (!buyer.name.trim() || !buyer.street.trim() || !buyer.postalCode.trim() || !buyer.city.trim()) b.push("Coordonnées du client incomplètes.");
  if (request.data.profile === "societe" && !buyer.vatNumber) b.push("Numéro d'entreprise du client manquant.");

  if (deps.vatRates.length === 0) b.push("Aucun taux de TVA n'est défini (page « Prestations et tarifs »).");
  b.push(...lineProblems(quote.lines, deps.vatRates));
  if (!Number.isInteger(quote.validDays) || quote.validDays < 1 || quote.validDays > 365) b.push("La durée de validité doit être comprise entre 1 et 365 jours.");
  if (!quote.subject.trim()) b.push("L'objet du devis est vide.");
  return b;
}

/** Émet le devis : numéro séquentiel, montants et identités figés, statut « émis ». */
export async function issueQuote(
  quote: Quote,
  request: StoredRequest,
  deps: Pick<BillingDeps, "vatRates" | "seller"> & { quoteTerms?: string },
  now = new Date(),
): Promise<Quote> {
  if (quote.status !== "draft") throw new Error("Ce devis est déjà émis.");
  const blockers = quoteBlockers(quote, request, deps);
  if (blockers.length) throw new QuoteBlockedError(blockers);
  const year = now.getUTCFullYear();
  const n = await nextSequence("quote", year);
  const at = now.toISOString();
  return replace("quotes", {
    ...quote,
    status: "sent",
    number: `D-${year}-${String(n).padStart(4, "0")}`,
    sentAt: at,
    updatedAt: at,
    validUntil: new Date(now.getTime() + quote.validDays * 86_400_000).toISOString(),
    seller: deps.seller,
    buyer: buyerFromRequest(request),
    vatRates: deps.vatRates,
    totals: computeTotals(quote.lines, deps.vatRates),
    quoteTerms: deps.quoteTerms ?? quote.quoteTerms ?? "",
  });
}

export class QuoteBlockedError extends Error {
  constructor(public blockers: string[]) {
    super(`Devis impossible : ${blockers.join(" ")}`);
    this.name = "QuoteBlockedError";
  }
}

/** Nouvelle version modifiable d'un devis existant (copie des lignes, sans numéro ni montants figés). */
export function duplicateAsDraft(quote: Quote, now = new Date()): Quote {
  const at = now.toISOString();
  return {
    id: newId("QUO", now),
    kind: "quote",
    requestId: quote.requestId,
    status: "draft",
    subject: quote.subject,
    notes: quote.notes,
    validDays: quote.validDays,
    lines: quote.lines.map((l) => ({ ...l })),
    createdAt: at,
    updatedAt: at,
    replaces: quote.id,
  };
}

/* ---------- Facture définitive ---------- */

/**
 * Liste TOUT ce qui empêche d'émettre une facture définitive. Une liste vide signifie que l'émission est permise.
 */
export function invoiceBlockers(quote: Quote, request: StoredRequest, deps: BillingDeps): string[] {
  const b: string[] = [];
  if (quote.status !== "accepted") b.push(`Le devis n'est pas accepté (statut : ${quote.status}).`);
  if (quote.invoiceId) b.push(`Ce devis a déjà donné lieu à la facture ${quote.invoiceId}.`);
  if (quote.requestId !== request.id) b.push("Le devis ne correspond pas à cette demande.");

  const s = deps.seller;
  const missing = (
    Object.entries({ "nom légal": s.legalName, adresse: s.street, "code postal": s.postalCode, ville: s.city, "numéro de TVA / d'entreprise": s.vatNumber }) as [string, string][]
  )
    .filter(([, v]) => !v.trim())
    .map(([k]) => k);
  if (missing.length) b.push(`Identité du vendeur incomplète : ${missing.join(", ")}.`);
  else if (!checkVatNumber(s.vatNumber).ok) b.push("Le numéro de TVA du vendeur est invalide.");

  const buyer = buyerFromRequest(request);
  if (!buyer.name.trim() || !buyer.street.trim() || !buyer.postalCode.trim() || !buyer.city.trim()) b.push("Informations de facturation du client incomplètes.");
  if (request.data.profile === "societe" && !buyer.vatNumber) b.push("Numéro d'entreprise du client manquant.");

  if (deps.vatRates.length === 0) b.push("Aucune règle de TVA n'est configurée.");
  b.push(...lineProblems(quote.lines, deps.vatRates));
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
  const invoice = await create<Invoice>("invoices", {
    id: newId("FAC", now),
    kind: "invoice",
    number: `${year}-${String(n).padStart(4, "0")}`,
    quoteId: quote.id,
    requestId: request.id,
    issuedAt: now.toISOString(),
    createdAt: now.toISOString(),
    seller: deps.seller,
    buyer: buyerFromRequest(request),
    lines: quote.lines as StrictLine[],
    totals: computeTotals(quote.lines, deps.vatRates),
  });
  const linked = await replace("quotes", { ...quote, invoiceId: invoice.id });
  return { invoice, quote: linked };
}
