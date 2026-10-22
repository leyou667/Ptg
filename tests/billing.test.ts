import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { catalog as realCatalog } from "@/config/pricing";
import { vatRates as realVat } from "@/config/vat";
import { sellerFromEnv } from "@/config/company";
import { computeTotals, PricingNotConfiguredError } from "@/lib/billing/totals";
import { buildQuote, invoiceBlockers, InvoiceBlockedError, issueInvoice, transitionQuote } from "@/lib/billing/workflow";
import type { BillingDeps } from "@/lib/billing/workflow";
import type { CatalogItem, VatRate } from "@/lib/billing/types";
import { requestSchema } from "@/lib/requests/schema";
import { saveRequest } from "@/lib/requests/store";
import { create, replace } from "@/lib/storage";

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
const testCatalog: CatalogItem[] = [{ id: "t-heure", label: "Prestation de test", unit: "heure", unitPriceCents: 3333, vatRateId: "t-a" }];
const testVat: VatRate[] = [
  { id: "t-a", label: "Taux A (test)", ratePercent: 20 },
  { id: "t-b", label: "Taux B (test)", ratePercent: 5 },
];
const testSeller = { legalName: "Vendeur Test SRL", legalForm: "SRL", street: "Rue du Test 1", postalCode: "1000", city: "Bruxelles", country: "Belgique", vatNumber: "BE 0403.019.261", iban: "", email: "", phone: "" };
const deps: BillingDeps = { catalog: testCatalog, vatRates: testVat, seller: testSeller };

const societe = requestSchema.parse({
  profile: "societe", companyName: "Client Test SA", vatNumber: "BE 0403.019.261", billingStreet: "Rue 1", billingPostalCode: "1000", billingCity: "Bruxelles", billingCountry: "Belgique",
  contactFirstName: "A", contactLastName: "B", email: "a@b.be", phone: "0486 37 45 48", siteSameAsBilling: true, nature: "entretien-regulier",
  placeType: "Bureaux", surface: 100, frequency: "Chaque semaine", description: "Description de test suffisante.", formula: "pro", consent: true,
});

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
        { itemId: "a", label: "A", unit: "h", quantity: 3, unitPriceCents: 3333, vatRateId: "t-a" },
        { itemId: "b", label: "B", unit: "h", quantity: 1, unitPriceCents: 1000, vatRateId: "t-b" },
      ],
      testVat,
    );
    expect(t.netCents).toBe(9999 + 1000);
    expect(t.vatByRate).toEqual([
      { vatRateId: "t-a", ratePercent: 20, baseCents: 9999, vatCents: 2000 },
      { vatRateId: "t-b", ratePercent: 5, baseCents: 1000, vatCents: 50 },
    ]);
    expect(t.vatCents).toBe(2050);
    expect(t.grossCents).toBe(t.netCents + t.vatCents);
    expect(Number.isInteger(t.grossCents)).toBe(true);
  });
  it("refuse de calculer sans prix ou sans TVA configurés", () => {
    expect(() => computeTotals([], testVat)).toThrow(PricingNotConfiguredError);
    expect(() => computeTotals([{ itemId: "a", label: "A", unit: "h", quantity: 1, unitPriceCents: 100, vatRateId: "x" }], testVat)).toThrow(/TVA inconnu/);
    expect(() => computeTotals([{ itemId: "a", label: "A", unit: "h", quantity: 1, unitPriceCents: 100, vatRateId: "t-a" }], [])).toThrow(PricingNotConfiguredError);
    expect(() => computeTotals([{ itemId: "a", label: "A", unit: "h", quantity: 1, unitPriceCents: 1.5, vatRateId: "t-a" }], testVat)).toThrow(/invalide/);
  });
});

describe("cycle devis puis facture", () => {
  it("refuse de créer un devis tant que le catalogue est vide", async () => {
    const req = await saveRequest(societe);
    expect(() => buildQuote(req, [{ itemId: "t-heure", quantity: 2 }], { catalog: [], vatRates: testVat })).toThrow(PricingNotConfiguredError);
  });
  it("applique les transitions autorisées seulement", async () => {
    const req = await saveRequest(societe);
    const q = buildQuote(req, [{ itemId: "t-heure", quantity: 2 }], deps);
    expect(q.status).toBe("draft");
    expect(() => transitionQuote(q, "accepted")).toThrow(/interdite/);
    const sent = transitionQuote(q, "sent");
    expect(sent.validUntil).toBeTruthy();
    const accepted = transitionQuote(sent, "accepted");
    expect(accepted.status).toBe("accepted");
    expect(() => transitionQuote(accepted, "declined")).toThrow(/interdite/);
    expect(() => transitionQuote(sent, "accepted", new Date(Date.now() + 40 * 86_400_000))).toThrow(/expiré/);
  });
  it("bloque la facture tant que le devis n'est pas accepté et liste chaque bloqueur", async () => {
    const req = await saveRequest(societe);
    const draft = buildQuote(req, [{ itemId: "t-heure", quantity: 1 }], deps);
    expect(invoiceBlockers(draft, req, deps).join(" ")).toMatch(/n'est pas accepté/);
    const empty = invoiceBlockers(draft, req, { catalog: [], vatRates: [], seller: sellerFromEnv({}) });
    expect(empty.length).toBeGreaterThanOrEqual(4);
    expect(empty.join(" ")).toMatch(/Identité du vendeur incomplète/);
    expect(empty.join(" ")).toMatch(/TVA/);
    expect(empty.join(" ")).toMatch(/prix/);
  });
  it("émet une facture numérotée sans trou, une seule par devis, et sépare les trois collections", async () => {
    const req = await saveRequest(societe);
    const q1 = transitionQuote(transitionQuote(buildQuote(req, [{ itemId: "t-heure", quantity: 2 }], deps), "sent"), "accepted");
    await create("quotes", q1);
    await expect(issueInvoice({ ...q1, status: "draft" }, req, deps)).rejects.toBeInstanceOf(InvoiceBlockedError);
    const { invoice, quote } = await issueInvoice(q1, req, deps);
    const year = new Date().getUTCFullYear();
    expect(invoice.number).toBe(`${year}-0001`);
    expect(quote.invoiceId).toBe(invoice.id);
    expect(invoice.totals.grossCents).toBe(Math.round(6666 * 1.2));
    expect(JSON.parse(await readFile(path.join(dir, "invoices", `${invoice.id}.json`), "utf8")).number).toBe(invoice.number);
    expect(JSON.parse(await readFile(path.join(dir, "quotes", `${q1.id}.json`), "utf8")).invoiceId).toBe(invoice.id);
    // une seconde facture pour le même devis est refusée
    await expect(issueInvoice(quote, req, deps)).rejects.toThrow(/déjà donné lieu/);

    const q2 = transitionQuote(transitionQuote(buildQuote(req, [{ itemId: "t-heure", quantity: 1 }], deps), "sent"), "accepted");
    await create("quotes", q2);
    const second = await issueInvoice(q2, req, deps);
    expect(second.invoice.number).toBe(`${year}-0002`);
    await replace("quotes", second.quote);
  });
  it("garde le prix figé dans le devis même si le catalogue change ensuite", async () => {
    const req = await saveRequest(societe);
    const q = buildQuote(req, [{ itemId: "t-heure", quantity: 1 }], deps);
    const changed: BillingDeps = { ...deps, catalog: [{ ...testCatalog[0], unitPriceCents: 9999 }] };
    expect(computeTotals(q.lines, changed.vatRates).netCents).toBe(3333);
  });
});
