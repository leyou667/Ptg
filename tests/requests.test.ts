import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkVatNumber } from "@/lib/be-vat";
import { requestSchema } from "@/lib/requests/schema";
import { findRequest, saveRequest, tokenMatches } from "@/lib/requests/store";
import { buildRequestPdf } from "@/lib/pdf/request-summary";
import { POST as postRequest } from "@/app/api/requests/route";
import { GET as getPdf } from "@/app/api/requests/[id]/pdf/route";

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cheyclean-test-"));
  process.env.DATA_DIR = dir;
  delete process.env.RESEND_API_KEY;
});
afterAll(async () => {
  delete process.env.DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

const particulier = {
  profile: "particulier",
  firstName: "Léa",
  lastName: "Dupont",
  email: "lea@exemple.be",
  phone: "0486 37 45 48",
  street: "Rue de la Loi 16",
  postalCode: "1000",
  city: "Bruxelles",
  nature: "entretien-regulier",
  placeType: "Appartement",
  surface: 80,
  frequency: "Chaque semaine",
  description: "Parquet fragile, deux chats, accès par interphone.",
  formula: "confort",
  consent: true,
  website: "",
};

const societe = {
  profile: "societe",
  companyName: "Atelier Œuvre SA",
  vatNumber: "BE 0403.019.261",
  billingStreet: "Avenue Louise 54",
  billingPostalCode: "1050",
  billingCity: "Ixelles",
  billingCountry: "Belgique",
  contactFirstName: "Marc",
  contactLastName: "Janssens",
  contactRole: "Office manager",
  email: "marc@atelier.be",
  phone: "+32 2 123 45 67",
  siteSameAsBilling: true,
  nature: "entretien-regulier",
  placeType: "Bureaux",
  surface: 420,
  frequency: "Plusieurs fois par semaine",
  description: "Trois étages de bureaux, cuisine commune, intervention avant 8 h.",
  preferredSchedule: "Entre 6 h et 8 h",
  formula: "pro",
  consent: true,
  website: "",
};

describe("numéros d'entreprise belges", () => {
  it("accepte un numéro dont la clé est correcte, sous plusieurs écritures", () => {
    for (const v of ["BE 0403.019.261", "0403019261", "BE0403.019.261", "403 019 261"]) {
      const r = checkVatNumber(v);
      expect(r.ok, v).toBe(true);
      if (r.ok) expect(r.normalized).toBe("BE 0403.019.261");
    }
  });
  it("refuse une clé fausse ou un format incorrect", () => {
    for (const v of ["BE 0403.019.262", "123", "", "BE 1234", "ABC"]) expect(checkVatNumber(v).ok, v).toBe(false);
  });
  it("accepte un numéro étranger de l'UE sans contrôle de clé", () => {
    expect(checkVatNumber("FR 12345678901")).toEqual({ ok: true, country: "FR", normalized: "FR 12345678901" });
  });
});

describe("validation des questionnaires", () => {
  it("accepte une demande de particulier et une demande de société valides", () => {
    expect(requestSchema.safeParse(particulier).success).toBe(true);
    const s = requestSchema.safeParse(societe);
    expect(s.success).toBe(true);
    if (s.success && s.data.profile === "societe") expect(s.data.vatNumber).toBe("BE 0403.019.261");
  });
  it("renvoie des messages français par champ", () => {
    const r = requestSchema.safeParse({ ...particulier, email: "lea", phone: "12", postalCode: "99", consent: false, description: "court" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const byField: Record<string, string> = {};
      for (const i of r.error.issues) byField[i.path.join(".")] ??= i.message; // premier message par champ, comme à l'écran
      expect(byField.email).toMatch(/@/);
      expect(byField.phone).toMatch(/incomplet/);
      expect(byField.postalCode).toMatch(/4 chiffres/);
      expect(byField.consent).toMatch(/consentement/);
      expect(byField.description).toMatch(/10 caractères/);
    }
  });
  it("exige l'adresse du lieu quand il diffère de l'adresse de facturation", () => {
    const r = requestSchema.safeParse({ ...societe, siteSameAsBilling: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path.join("."))).toEqual(expect.arrayContaining(["siteStreet", "sitePostalCode", "siteCity"]));
    expect(requestSchema.safeParse({ ...societe, siteSameAsBilling: false, siteStreet: "Rue Neuve 1", sitePostalCode: "4000", siteCity: "Liège" }).success).toBe(true);
  });
  it("refuse un numéro de TVA invalide et une valeur hors liste", () => {
    expect(requestSchema.safeParse({ ...societe, vatNumber: "BE 0403.019.262" }).success).toBe(false);
    expect(requestSchema.safeParse({ ...particulier, placeType: "Château" }).success).toBe(false);
    expect(requestSchema.safeParse({ ...particulier, formula: "pro" }).success).toBe(false);
  });
  it("nettoie les caractères de contrôle et les espaces", () => {
    const r = requestSchema.safeParse({ ...particulier, firstName: "  Léa\u0000   Marie " });
    expect(r.success && r.data.profile === "particulier" && r.data.firstName).toBe("Léa Marie");
  });
});

describe("enregistrement durable", () => {
  it("écrit un fichier JSON réel, relisible, avec une référence valide", async () => {
    const data = requestSchema.parse(particulier);
    const rec = await saveRequest(data);
    expect(rec.id).toMatch(/^DEV-\d{4}-[0-9A-Z]{6}$/);
    const onDisk = JSON.parse(await readFile(path.join(dir, "requests", `${rec.id}.json`), "utf8"));
    expect(onDisk.data.lastName).toBe("Dupont");
    expect(onDisk.data).not.toHaveProperty("consent");
    expect(onDisk.consentAt).toBeTruthy();
    expect((await findRequest(rec.id))?.id).toBe(rec.id);
  });
  it("ne mélange pas les collections : demandes, devis et factures sont des dossiers distincts", async () => {
    await saveRequest(requestSchema.parse(societe));
    const entries = await readdir(dir);
    expect(entries).toContain("requests");
    expect(entries).not.toContain("quotes");
    expect(entries).not.toContain("invoices");
  });
  it("refuse un identifiant qui tente de sortir du dossier", async () => {
    expect(await findRequest("../../etc/passwd")).toBeNull();
  });
});

describe("PDF récapitulatif", () => {
  it("produit un vrai PDF lisible, sans prix ni numéro de facture", async () => {
    const rec = await saveRequest(requestSchema.parse(societe));
    const bytes = await buildRequestPdf(rec);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    const file = path.join(dir, "recap.pdf");
    await writeFile(file, bytes);
    let text = "";
    try {
      text = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    } catch {
      return; // pdftotext absent : le contrôle de structure ci-dessus suffit
    }
    expect(text).toContain(rec.id);
    expect(text).toContain("Atelier");
    expect(text).toContain("Œuvre"); // caractère hors ASCII écrit correctement (WinAnsi)
    expect(text).toContain("BE 0403.019.261");
    expect(text).toContain("Marc Janssens");
    expect(text).toContain("420 m²");
    expect(text).toMatch(/ni un devis ni une facture/);
    expect(text).not.toMatch(/€|\bEUR\b|Facture n|Total/i);
  });
  it("découpe un long texte sur plusieurs lignes sans planter", async () => {
    const long = requestSchema.parse({ ...particulier, description: "mot ".repeat(340) + "x".repeat(120) });
    const rec = await saveRequest(long);
    expect((await buildRequestPdf(rec)).length).toBeGreaterThan(1000);
  });
});

describe("API /api/requests", () => {
  const call = (body: unknown, ip = "1.1.1." + Math.floor(Math.random() * 250)) =>
    postRequest(new Request("http://x/api/requests", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": ip } }));

  it("enregistre, renvoie référence et jeton, puis sert le PDF avec ce jeton uniquement", async () => {
    const res = await call(particulier);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.emailed).toBe(false);
    expect(await readFile(path.join(dir, "requests", `${body.reference}.json`), "utf8")).toContain("Dupont");

    const ctx = { params: Promise.resolve({ id: body.reference }) };
    const good = await getPdf(new Request(`http://x/api/requests/${body.reference}/pdf?token=${body.accessToken}`), ctx);
    expect(good.status).toBe(200);
    expect(good.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await good.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");

    const bad = await getPdf(new Request(`http://x/api/requests/${body.reference}/pdf?token=${"0".repeat(48)}`), ctx);
    expect(bad.status).toBe(404);
    const none = await getPdf(new Request(`http://x/api/requests/${body.reference}/pdf`), ctx);
    expect(none.status).toBe(404);
    const rec = await findRequest(body.reference);
    expect(tokenMatches(rec!, body.accessToken)).toBe(true);
  });
  it("répond 400 avec les champs fautifs quand les données sont invalides", async () => {
    const res = await call({ ...societe, vatNumber: "BE 1" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fields.some((f: { path: string }) => f.path === "vatNumber")).toBe(true);
  });
  it("ignore silencieusement un robot (champ piège) sans rien écrire", async () => {
    const before = (await readdir(path.join(dir, "requests"))).length;
    const res = await call({ ...particulier, website: "http://spam" });
    expect(res.status).toBe(200);
    expect((await readdir(path.join(dir, "requests"))).length).toBe(before);
  });
  it("limite le nombre d'envois par adresse", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 8; i++) codes.push((await call(particulier, "9.9.9.9")).status);
    expect(codes.slice(0, 6).every((c) => c === 201)).toBe(true);
    expect(codes[7]).toBe(429);
  });
  it("refuse franchement quand aucun stockage n'est disponible, au lieu de simuler", async () => {
    const saved = { d: process.env.DATA_DIR, v: process.env.VERCEL };
    delete process.env.DATA_DIR;
    process.env.VERCEL = "1";
    const res = await call(particulier);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("storage_unavailable");
    process.env.DATA_DIR = saved.d;
    if (saved.v === undefined) delete process.env.VERCEL;
  });
});
