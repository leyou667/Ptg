import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { catalog as realCatalog } from "@/config/pricing";
import { vatRates as realVat } from "@/config/vat";
import { sellerFromEnv } from "@/config/company";
import { computeTotals, lineProblems, PricingNotConfiguredError } from "@/lib/billing/totals";
import {
  createDraftQuote,
  draftPatchSchema,
  duplicateAsDraft,
  InvoiceBlockedError,
  invoiceBlockers,
  issueInvoice,
  issueQuote,
  QuoteBlockedError,
  quoteBlockers,
  transitionQuote,
  updateDraft,
} from "@/lib/billing/workflow";
import type { BillingDeps } from "@/lib/billing/workflow";
import type { Quote, VatRate } from "@/lib/billing/types";
import { requestSchema } from "@/lib/requests/schema";
import { saveRequest } from "@/lib/requests/store";
import { create, get } from "@/lib/storage";

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cheyclean-bill-"));
  process.env.DATA_DIR = dir;
});
afterAll(async () => {
  delete process.env.DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

/** Valeurs de TEST uniquement : ce ne sont pas des prix ni des taux de l'entreprise. */
const testVat: VatRate[] = [
  { id: "t-a", label: "Taux A (test)", ratePercent: 20 },
  { id: "t-b", label: "Taux B (test)", ratePercent: 5 },
];
const testSeller = { legalName: "Vendeur Test SRL", legalForm: "SRL", street: "Rue du Test 1", postalCode: "1000", city: "Bruxelles", country: "Belgique", vatNumber: "BE 0403.019.261", iban: "", email: "", phone: "" };
const deps: BillingDeps = { catalog: [], vatRates: testVat, seller: testSeller };

const societe = requestSchema.parse({
  profile: "societe", companyName: "Client Test SA", vatNumber: "BE 0403.019.261", billingStreet: "Rue 1", billingPostalCode: "1000", billingCity: "Bruxelles", billingCountry: "Belgique",
  contactFirstName: "A", contactLastName: "B", email: "a@b.be", phone: "0486 37 45 48", siteSameAsBilling: true, nature: "entretien-regulier",
  placeType: "Bureaux", surface: 100, frequency: "Chaque semaine", description: "Description de test suffisante.", formula: "pro", consent: true,
});

const priced = (q: Quote, price = 3333, qty = 2): Quote => ({ ...q, lines: [{ label: "Prestation de test", unit: "heure", quantity: qty, unitPriceCents: price, vatRateId: "t-a" }] });

describe("configuration livrée", () => {
  it("ne contient aucun prix, aucune règle de TVA et aucune identité de vendeur inventés", () => {
    expect(realCatalog).toEqual([]);
    expect(realVat).toEqual([]);
    expect(sellerFromEnv({}).legalName).toBe("");
  });
});

describe("calcul des totaux", () => {
  it("calcule en centimes entiers, par taux de TVA", () => {
    const t = computeTotals(
      [
        { label: "A", unit: "h", quantity: 3, unitPriceCents: 3333, vatRateId: "t-a" },
        { label: "B", unit: "h", quantity: 1, unitPriceCents: 1000, vatRateId: "t-b" },
      ],
      testVat,
    );
    expect(t.netCents).toBe(9999 + 1000);
    expect(t.vatByRate).toEqual([
      { vatRateId: "t-a", ratePercent: 20, baseCents: 9999, vatCents: 2000 },
      { vatRateId: "t-b", ratePercent: 5, baseCents: 1000, vatCents: 50 },
    ]);
    expect(t.grossCents).toBe(t.netCents + t.vatCents);
  });
  it("refuse de calculer sans prix, sans taux ou avec des valeurs invalides", () => {
    const line = { label: "A", unit: "h", quantity: 1, unitPriceCents: 100, vatRateId: "t-a" };
    expect(() => computeTotals([], testVat)).toThrow(PricingNotConfiguredError);
    expect(() => computeTotals([line], [])).toThrow(/TVA/);
    expect(() => computeTotals([{ ...line, unitPriceCents: null }], testVat)).toThrow(/prix unitaire manquant/);
    expect(() => computeTotals([{ ...line, vatRateId: null }], testVat)).toThrow(/taux de TVA manquant/);
    expect(() => computeTotals([{ ...line, vatRateId: "zz" }], testVat)).toThrow(/inconnu/);
    expect(() => computeTotals([{ ...line, unitPriceCents: 1.5 }], testVat)).toThrow(/prix unitaire/);
    expect(() => computeTotals([{ ...line, quantity: 0 }], testVat)).toThrow(/quantité/);
    expect(lineProblems([{ ...line, label: " " }], testVat)).toEqual(["Ligne 1 : désignation manquante."]);
  });
});

describe("brouillon de devis", () => {
  it("est prérempli depuis le questionnaire, sans aucun prix inventé", async () => {
    const req = await saveRequest(societe);
    const q = createDraftQuote(req, { validDays: 30 });
    expect(q.status).toBe("draft");
    expect(q.requestId).toBe(req.id);
    expect(q.subject).toMatch(/Entretien régulier des locaux, Bureaux, 100 m², Bruxelles/);
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0].label).toMatch(/Bureaux \(100 m²\)/);
    expect(q.lines[0].unitPriceCents).toBeNull();
    expect(q.lines[0].vatRateId).toBeNull();
    expect(q.number).toBeUndefined();
  });
  it("valide les modifications et n'accepte plus de changement une fois émis", async () => {
    const req = await saveRequest(societe);
    const q = await create("quotes", createDraftQuote(req));
    expect(draftPatchSchema.safeParse({ subject: "x", notes: "", validDays: 0, lines: [] }).success).toBe(false);
    expect(draftPatchSchema.safeParse({ subject: "x", notes: "", validDays: 30, lines: [{ label: "L", unit: "h", quantity: -1, unitPriceCents: 100, vatRateId: null }] }).success).toBe(false);
    const patch = { subject: "Objet modifié", notes: "Note", validDays: 15, lines: priced(q).lines };
    const updated = await updateDraft(q, patch);
    expect(updated.subject).toBe("Objet modifié");
    expect(updated.rev).toBe(2);
    const issued = await issueQuote(updated, req, deps);
    await expect(updateDraft(issued, patch)).rejects.toThrow(/émis/);
  });
});

describe("émission du devis", () => {
  it("liste chaque bloqueur tant que les informations manquent", async () => {
    const req = await saveRequest(societe);
    const q = createDraftQuote(req);
    const none = quoteBlockers(q, req, { vatRates: [], seller: sellerFromEnv({}) }).join(" | ");
    expect(none).toMatch(/entreprise incomplètes/);
    expect(none).toMatch(/Aucun taux de TVA/);
    expect(none).toMatch(/prix unitaire manquant/);
    expect(none).toMatch(/taux de TVA manquant/);
    expect(quoteBlockers(priced(q), req, deps)).toEqual([]);
    expect(quoteBlockers({ ...priced(q), validDays: 0 }, req, deps).join()).toMatch(/validité/);
    expect(quoteBlockers(priced(q), req, { ...deps, seller: { ...testSeller, vatNumber: "BE 1" } }).join()).toMatch(/invalide/);
  });
  it("refuse d'émettre un devis incomplet", async () => {
    const req = await saveRequest(societe);
    await expect(issueQuote(createDraftQuote(req), req, deps)).rejects.toBeInstanceOf(QuoteBlockedError);
  });
  it("numérote sans trou, fige les montants et les identités, et refuse une seconde émission", async () => {
    const req = await saveRequest(societe);
    const year = new Date().getUTCFullYear();
    const a = await issueQuote(await create("quotes", priced(createDraftQuote(req))), req, deps);
    const n = Number(a.number!.split("-")[2]); // d'autres tests ont déjà émis des devis : on contrôle la continuité, pas la valeur absolue
    expect(a.number).toBe(`D-${year}-${String(n).padStart(4, "0")}`);
    expect(a.status).toBe("sent");
    expect(a.totals?.grossCents).toBe(Math.round(6666 * 1.2));
    expect(a.seller?.legalName).toBe("Vendeur Test SRL");
    expect(a.buyer?.vatNumber).toBe("BE 0403.019.261");
    expect(a.validUntil && new Date(a.validUntil) > new Date()).toBe(true);
    await expect(issueQuote(a, req, deps)).rejects.toThrow(/déjà émis/);
    const b = await issueQuote(await create("quotes", priced(createDraftQuote(req), 1000, 1)), req, deps);
    expect(b.number).toBe(`D-${year}-${String(n + 1).padStart(4, "0")}`);
    expect(JSON.parse(await readFile(path.join(dir, "quotes", `${a.id}.json`), "utf8")).number).toBe(a.number);
  });
  it("applique les transitions autorisées seulement, et duplique en nouvelle version", async () => {
    const req = await saveRequest(societe);
    const sent = await issueQuote(await create("quotes", priced(createDraftQuote(req))), req, deps);
    expect(() => transitionQuote(createDraftQuote(req), "accepted")).toThrow(/interdite/);
    const accepted = transitionQuote(sent, "accepted");
    expect(accepted.acceptedAt).toBeTruthy();
    expect(() => transitionQuote(accepted, "declined")).toThrow(/interdite/);
    expect(() => transitionQuote(sent, "accepted", new Date(Date.now() + 40 * 86_400_000))).toThrow(/expiré/);
    const copy = duplicateAsDraft(sent);
    expect(copy.status).toBe("draft");
    expect(copy.number).toBeUndefined();
    expect(copy.totals).toBeUndefined();
    expect(copy.replaces).toBe(sent.id);
    expect(copy.lines).toEqual(sent.lines);
  });
});

describe("facture définitive", () => {
  it("reste bloquée tant que le devis n'est pas accepté et que tout n'est pas configuré", async () => {
    const req = await saveRequest(societe);
    const q = await issueQuote(await create("quotes", priced(createDraftQuote(req))), req, deps);
    expect(invoiceBlockers(q, req, deps).join(" ")).toMatch(/n'est pas accepté/);
    const empty = invoiceBlockers(q, req, { catalog: [], vatRates: [], seller: sellerFromEnv({}) });
    expect(empty.join(" ")).toMatch(/Identité du vendeur incomplète/);
    expect(empty.join(" ")).toMatch(/TVA/);
  });
  it("émet une facture numérotée, une seule par devis", async () => {
    const req = await saveRequest(societe);
    const sent = await issueQuote(await create("quotes", priced(createDraftQuote(req))), req, deps);
    const accepted = await (await import("@/lib/storage")).replace("quotes", transitionQuote(sent, "accepted"));
    await expect(issueInvoice({ ...accepted, status: "sent" }, req, deps)).rejects.toBeInstanceOf(InvoiceBlockedError);
    const { invoice, quote } = await issueInvoice(accepted, req, deps);
    const year = new Date().getUTCFullYear();
    expect(invoice.number).toBe(`${year}-0001`);
    expect(quote.invoiceId).toBe(invoice.id);
    expect((await get<Quote>("quotes", accepted.id))?.invoiceId).toBe(invoice.id);
    await expect(issueInvoice(quote, req, deps)).rejects.toThrow(/déjà donné lieu/);
  });
});
