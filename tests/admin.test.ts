import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/admin/password";
import { csrfFor, signSession, verifySession } from "@/lib/admin/token";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { PATCH as patchRequest } from "@/app/api/admin/requests/[id]/route";
import { POST as createQuote } from "@/app/api/admin/requests/[id]/quotes/route";
import { GET as requestPdf } from "@/app/api/admin/requests/[id]/pdf/route";
import { PUT as putQuote } from "@/app/api/admin/quotes/[id]/route";
import { POST as issue } from "@/app/api/admin/quotes/[id]/issue/route";
import { POST as quoteStatus } from "@/app/api/admin/quotes/[id]/status/route";
import { POST as duplicate } from "@/app/api/admin/quotes/[id]/duplicate/route";
import { GET as quotePdf } from "@/app/api/admin/quotes/[id]/pdf/route";
import { PUT as putSettings } from "@/app/api/admin/settings/[name]/route";
import { proxy } from "@/proxy";
import { requestSchema } from "@/lib/requests/schema";
import { findRequest, saveRequest, statusOf } from "@/lib/requests/store";
import { listRows } from "@/lib/admin/service";
import { get } from "@/lib/storage";
import type { Quote } from "@/lib/billing/types";

const PASSWORD = "un-mot-de-passe-solide-pour-test";
const SECRET = "s".repeat(48);
const HOST = "admin.test";
const ORIGIN = `http://${HOST}`;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cheyclean-admin-"));
  process.env.DATA_DIR = dir;
  process.env.ADMIN_PASSWORD_HASH = await hashPassword(PASSWORD);
  process.env.ADMIN_SESSION_SECRET = SECRET;
});
afterAll(async () => {
  for (const k of ["DATA_DIR", "ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET"]) delete process.env[k];
  await rm(dir, { recursive: true, force: true });
});

let ipN = 0;
const freshIp = () => `10.0.${Math.floor(++ipN / 250)}.${ipN % 250}`;

type Init = { method?: string; body?: unknown; cookie?: string; csrf?: string; origin?: string | null; ip?: string };
const req = (url: string, i: Init = {}) =>
  new Request(`${ORIGIN}${url}`, {
    method: i.method ?? "GET",
    headers: {
      host: HOST,
      "x-forwarded-for": i.ip ?? freshIp(),
      ...(i.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(i.cookie ? { cookie: i.cookie } : {}),
      ...(i.csrf ? { "x-csrf-token": i.csrf } : {}),
      ...(i.origin === null ? {} : { origin: i.origin ?? ORIGIN }),
    },
    body: i.body !== undefined ? JSON.stringify(i.body) : undefined,
  });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

async function session() {
  const res = await login(req("/api/admin/login", { method: "POST", body: { password: PASSWORD } }));
  expect(res.status).toBe(200);
  const setCookie = res.headers.get("set-cookie")!;
  return { cookie: setCookie.split(";")[0], csrf: (await res.json()).csrf as string, setCookie };
}

const societe = requestSchema.parse({
  profile: "societe", companyName: "Atelier Œuvre SA", vatNumber: "BE 0403.019.261", billingStreet: "Avenue Louise 54", billingPostalCode: "1050", billingCity: "Ixelles", billingCountry: "Belgique",
  contactFirstName: "Marc", contactLastName: "Janssens", contactRole: "Office manager", email: "marc@atelier.be", phone: "+32 2 123 45 67", siteSameAsBilling: true,
  nature: "entretien-regulier", placeType: "Bureaux", surface: 420, frequency: "Plusieurs fois par semaine", description: "Trois étages de bureaux, cuisine commune.", formula: "pro", consent: true,
});

describe("mots de passe et jetons", () => {
  it("vérifie un mot de passe sans le conserver, et refuse une empreinte altérée", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("scrypt:")).toBe(true);
    expect(h).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("correct horse batterY", h)).toBe(false);
    expect(await verifyPassword("x", h.replace(/.$/, "A"))).toBe(false);
    expect(await verifyPassword("x", "n'importe quoi")).toBe(false);
    expect(await hashPassword("correct horse battery")).not.toBe(h); // sel aléatoire
  });
  it("signe les sessions et refuse toute falsification, expiration ou autre secret", async () => {
    const now = Math.floor(Date.now() / 1000);
    const t = await signSession(SECRET, { sid: "abc", iat: now, exp: now + 60 });
    expect((await verifySession(SECRET, t))?.sid).toBe("abc");
    expect(await verifySession("autre-secret".repeat(4), t)).toBeNull();
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sid: "abc", iat: now, exp: now + 99999 })).toString("base64url");
    expect(await verifySession(SECRET, `${forged}.${sig}`)).toBeNull();
    expect(await verifySession(SECRET, `${body}.${sig.slice(0, -2)}AA`)).toBeNull();
    expect(await verifySession(SECRET, await signSession(SECRET, { sid: "abc", iat: now - 100, exp: now - 10 }))).toBeNull();
    expect(await verifySession(SECRET, "n.importe.quoi")).toBeNull();
    expect(await verifySession(SECRET, "")).toBeNull();
    expect(await csrfFor(SECRET, "a")).not.toBe(await csrfFor(SECRET, "b"));
  });
});

describe("connexion", () => {
  it("refuse un mauvais mot de passe sans rien révéler, accepte le bon et pose un cookie protégé", async () => {
    const bad = await login(req("/api/admin/login", { method: "POST", body: { password: "mauvais" } }));
    expect(bad.status).toBe(401);
    expect(await bad.json()).toEqual({ error: "invalid_credentials" });
    expect(bad.headers.get("set-cookie")).toBeNull();
    const { setCookie, csrf } = await session();
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    expect(setCookie).toMatch(/Max-Age=28800/);
    expect(setCookie).not.toContain(PASSWORD);
    expect(csrf.length).toBeGreaterThan(20);
  });
  it("pose un cookie Secure et préfixé __Host- en HTTPS", async () => {
    const res = await login(new Request("https://admin.test/api/admin/login", { method: "POST", headers: { host: HOST, origin: ORIGIN, "x-forwarded-for": freshIp(), "x-forwarded-proto": "https", "content-type": "application/json" }, body: JSON.stringify({ password: PASSWORD }) }));
    const c = res.headers.get("set-cookie")!;
    expect(c).toMatch(/^__Host-cc_admin=/);
    expect(c).toMatch(/Secure/);
  });
  it("limite les essais par adresse (429 au sixième)", async () => {
    const ip = freshIp();
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await login(req("/api/admin/login", { method: "POST", body: { password: "x" }, ip }))).status);
    expect(codes).toEqual([401, 401, 401, 401, 401, 429]);
    // même avec le bon mot de passe, l'adresse bloquée reste bloquée
    expect((await login(req("/api/admin/login", { method: "POST", body: { password: PASSWORD }, ip }))).status).toBe(429);
  });
  it("refuse une origine étrangère et un corps invalide", async () => {
    expect((await login(req("/api/admin/login", { method: "POST", body: { password: PASSWORD }, origin: "http://evil.example" }))).status).toBe(403);
    expect((await login(req("/api/admin/login", { method: "POST", body: { password: PASSWORD }, origin: null }))).status).toBe(403);
  });
  it("est désactivée tant que l'administration n'est pas configurée", async () => {
    const saved = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_PASSWORD_HASH;
    const res = await login(req("/api/admin/login", { method: "POST", body: { password: PASSWORD } }));
    expect(res.status).toBe(503);
    const s = await session().catch(() => null);
    expect(s).toBeNull();
    process.env.ADMIN_PASSWORD_HASH = saved;
  });
  it("se déconnecte en effaçant les cookies ET en révoquant la session : un cookie copié ne marche plus", async () => {
    const { cookie, csrf } = await session();
    const r = await saveRequest(societe);
    const call = () => patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { note: "test" }, cookie, csrf }), params({ id: r.id }));
    expect((await call()).status).toBe(200);
    const res = await logout(req("/api/admin/logout", { method: "POST", cookie }));
    expect(res.headers.getSetCookie().every((c) => /Max-Age=0/.test(c))).toBe(true);
    expect((await call()).status).toBe(401); // le cookie volé, rejoué après la déconnexion, est refusé
    const other = await session(); // une nouvelle session reste valable
    expect((await patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { note: "autre" }, ...other }), params({ id: r.id }))).status).toBe(200);
  });
});

describe("contrôle d'accès des routes d'administration", () => {
  const record = async () => saveRequest(societe);
  it("refuse (401) sans session, avec un cookie falsifié ou expiré, sur chaque route", async () => {
    const r = await record();
    const now = Math.floor(Date.now() / 1000);
    const expired = `cc_admin=${await signSession(SECRET, { sid: "x", iat: now - 100, exp: now - 10 })}`;
    const forged = `cc_admin=${await signSession("pas-le-bon-secret-pas-le-bon-secret", { sid: "x", iat: now, exp: now + 999 })}`;
    const calls: [string, () => Promise<Response>][] = [
      ["PATCH demande", (c?: string) => patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { status: "in_progress" }, cookie: c }), params({ id: r.id }))] as never,
      ["POST devis", (c?: string) => createQuote(req(`/api/admin/requests/${r.id}/quotes`, { method: "POST", body: {}, cookie: c }), params({ id: r.id }))] as never,
      ["GET pdf demande", (c?: string) => requestPdf(req(`/api/admin/requests/${r.id}/pdf`, { cookie: c }), params({ id: r.id }))] as never,
      ["PUT réglages", (c?: string) => putSettings(req(`/api/admin/settings/vat`, { method: "PUT", body: { rates: [] }, cookie: c }), params({ name: "vat" }))] as never,
      ["GET pdf devis", (c?: string) => quotePdf(req(`/api/admin/quotes/QUO-2610-AAAAAA/pdf`, { cookie: c }), params({ id: "QUO-2610-AAAAAA" }))] as never,
    ];
    for (const [name, call] of calls) {
      for (const cookie of [undefined, expired, forged]) {
        const res = await (call as unknown as (c?: string) => Promise<Response>)(cookie);
        expect(res.status, `${name} avec ${cookie ? "cookie invalide" : "aucun cookie"}`).toBe(401);
        expect(res.headers.get("content-type")).not.toMatch(/pdf/);
      }
    }
    expect((await findRequest(r.id))?.status).toBe("new"); // rien n'a été modifié
  });
  it("refuse (403) une modification sans jeton CSRF, avec un mauvais jeton, ou depuis une autre origine", async () => {
    const r = await record();
    const { cookie, csrf } = await session();
    const patch = (init: Init) => patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { status: "archived" }, cookie, ...init }), params({ id: r.id }));
    expect((await patch({})).status).toBe(403);
    expect((await patch({ csrf: "faux" })).status).toBe(403);
    expect((await patch({ csrf: csrf.slice(0, -1) + (csrf.endsWith("A") ? "B" : "A") })).status).toBe(403);
    expect((await patch({ csrf, origin: "http://evil.example" })).status).toBe(403);
    expect((await patch({ csrf, origin: null })).status).toBe(403);
    expect(statusOf((await findRequest(r.id))!)).toBe("new");
    expect((await patch({ csrf })).status).toBe(200);
    expect(statusOf((await findRequest(r.id))!)).toBe("archived");
  });
  it("le jeton CSRF d'une session ne marche pas avec une autre session", async () => {
    const r = await record();
    const a = await session();
    const b = await session();
    const res = await patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { status: "archived" }, cookie: a.cookie, csrf: b.csrf }), params({ id: r.id }));
    expect(res.status).toBe(403);
  });
  it("le proxy refuse /admin et /api/admin sans session, et laisse passer la connexion et les sessions valides", async () => {
    const page = await proxy(new NextRequest("http://admin.test/admin"));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://admin.test/admin/login");
    const deep = await proxy(new NextRequest("http://admin.test/admin/demandes/DEV-2610-AAAAAA"));
    expect(deep.status).toBe(307);
    const api = await proxy(new NextRequest("http://admin.test/api/admin/requests/x/pdf"));
    expect(api.status).toBe(401);
    expect((await proxy(new NextRequest("http://admin.test/admin/login"))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(new NextRequest("http://admin.test/api/admin/login"))).headers.get("x-middleware-next")).toBe("1");
    const { cookie } = await session();
    const ok = await proxy(new NextRequest("http://admin.test/admin", { headers: { cookie } }));
    expect(ok.headers.get("x-middleware-next")).toBe("1");
    const bad = await proxy(new NextRequest("http://admin.test/admin", { headers: { cookie: "cc_admin=n.importe" } }));
    expect(bad.status).toBe(307);
  });
});

describe("traitement d'une demande et préparation du devis", () => {
  it("de la demande reçue au devis émis, avec PDF et statuts cohérents", async () => {
    const { cookie, csrf } = await session();
    const as = (init: Init = {}) => ({ cookie, csrf, ...init });
    const r = await saveRequest(societe);
    expect(statusOf(r)).toBe("new");

    // consultation
    expect((await listRows()).some((row) => row.request.id === r.id && row.status === "new")).toBe(true);
    const pdf = await requestPdf(req(`/api/admin/requests/${r.id}/pdf`, { cookie }), params({ id: r.id }));
    expect(pdf.status).toBe(200);
    expect(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");

    // note + statut
    const n = await patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { note: "Appel client prévu mardi.", status: "in_progress" }, ...as() }), params({ id: r.id }));
    expect(n.status).toBe(200);
    expect((await patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { status: "pirate" }, ...as() }), params({ id: r.id }))).status).toBe(400);
    expect((await patchRequest(req(`/api/admin/requests/${r.id}`, { method: "PATCH", body: { note: "   " }, ...as() }), params({ id: r.id }))).status).toBe(400);
    const afterNote = (await findRequest(r.id))!;
    expect(statusOf(afterNote)).toBe("in_progress");
    expect(afterNote.notes?.map((x) => x.text)).toEqual(["Appel client prévu mardi."]);
    expect(afterNote.statusHistory?.map((h) => h.status)).toEqual(["new", "in_progress"]);

    // brouillon prérempli
    const created = await createQuote(req(`/api/admin/requests/${r.id}/quotes`, { method: "POST", body: {}, ...as() }), params({ id: r.id }));
    expect(created.status).toBe(201);
    const qid = (await created.json()).quoteId as string;
    let quote = (await get<Quote>("quotes", qid))!;
    expect(quote.status).toBe("draft");
    expect(quote.subject).toMatch(/Bureaux, 420 m², Ixelles/);

    // PDF impossible tant que l'entreprise, la TVA et les prix manquent : la réponse dit pourquoi
    const blocked = await quotePdf(req(`/api/admin/quotes/${qid}/pdf`, { cookie }), params({ id: qid }));
    expect(blocked.status).toBe(409);
    const why = (await blocked.json()).blockers.join(" | ");
    expect(why).toMatch(/entreprise incomplètes/);
    expect(why).toMatch(/Aucun taux de TVA/);
    expect(why).toMatch(/prix unitaire manquant/);
    const issueTooEarly = await issue(req(`/api/admin/quotes/${qid}/issue`, { method: "POST", body: {}, ...as() }), params({ id: qid }));
    expect(issueTooEarly.status).toBe(409);
    expect((await get<Quote>("quotes", qid))?.number).toBeUndefined();

    // réglages saisis à la main
    const company = { seller: { legalName: "CheyClean SRL", legalForm: "SRL", street: "Rue du Nettoyage 12", postalCode: "1000", city: "Bruxelles", country: "Belgique", vatNumber: "0403.019.261", iban: "BE68 5390 0754 7034", email: "devis@cheyclean.test", phone: "0486 37 45 48" }, quoteTerms: "Paiement à 30 jours. Intervention planifiée après acceptation.", defaultValidDays: 30 };
    expect((await putSettings(req("/api/admin/settings/company", { method: "PUT", body: company, ...as() }), params({ name: "company" }))).status).toBe(200);
    expect((await putSettings(req("/api/admin/settings/vat", { method: "PUT", body: { rates: [{ id: "taux-test", label: "Taux de test", ratePercent: 21 }] }, ...as() }), params({ name: "vat" }))).status).toBe(200);
    expect((await putSettings(req("/api/admin/settings/catalog", { method: "PUT", body: { items: [{ id: "entretien-test", label: "Entretien de bureaux", unit: "heure", unitPriceCents: 3500, vatRateId: "taux-test" }] }, ...as() }), params({ name: "catalog" }))).status).toBe(200);

    // modification du brouillon : une révision périmée est refusée
    quote = (await get<Quote>("quotes", qid))!;
    const lines = [
      { itemId: "entretien-test", label: "Entretien de bureaux", unit: "heure", quantity: 12.5, unitPriceCents: 3500, vatRateId: "taux-test" },
      { label: "Produits spécifiques (ligne libre)", description: "Désinfectant sans parfum", unit: "forfait", quantity: 1, unitPriceCents: 4250, vatRateId: "taux-test" },
    ];
    const body = { subject: quote.subject, notes: "Accès par le parking.", validDays: 30, lines, rev: quote.rev };
    expect((await putQuote(req(`/api/admin/quotes/${qid}`, { method: "PUT", body: { ...body, rev: 99 }, ...as() }), params({ id: qid }))).status).toBe(409);
    expect((await putQuote(req(`/api/admin/quotes/${qid}`, { method: "PUT", body: { ...body, lines: [{ ...lines[0], quantity: -2 }] }, ...as() }), params({ id: qid }))).status).toBe(400);
    expect((await putQuote(req(`/api/admin/quotes/${qid}`, { method: "PUT", body, ...as() }), params({ id: qid }))).status).toBe(200);

    // aperçu filigrané du brouillon complet
    const preview = await quotePdf(req(`/api/admin/quotes/${qid}/pdf`, { cookie }), params({ id: qid }));
    expect(preview.status).toBe(200);
    const pf = path.join(dir, "preview.pdf");
    await writeFile(pf, Buffer.from(await preview.arrayBuffer()));
    expect(execFileSync("pdftotext", ["-layout", pf, "-"], { encoding: "utf8" })).toMatch(/Aperçu \(non valable\)/);

    // émission : numéro, montants figés, demande « devis envoyé »
    const issued = await issue(req(`/api/admin/quotes/${qid}/issue`, { method: "POST", body: {}, ...as() }), params({ id: qid }));
    expect(issued.status).toBe(200);
    const number = (await issued.json()).number as string;
    expect(number).toMatch(/^D-\d{4}-\d{4}$/);
    expect(statusOf((await findRequest(r.id))!)).toBe("quoted");
    quote = (await get<Quote>("quotes", qid))!;
    // 12,5 h × 35,00 = 437,50 ; + 42,50 = 480,00 HT ; TVA 21 % = 100,80 ; TTC 580,80
    expect(quote.totals).toMatchObject({ netCents: 48000, vatCents: 10080, grossCents: 58080 });
    expect(quote.status).toBe("sent");

    const finalPdf = await quotePdf(req(`/api/admin/quotes/${qid}/pdf`, { cookie }), params({ id: qid }));
    expect(finalPdf.status).toBe(200);
    expect(finalPdf.headers.get("content-disposition")).toContain(number);
    const ff = path.join(dir, "final.pdf");
    await writeFile(ff, Buffer.from(await finalPdf.arrayBuffer()));
    const text = execFileSync("pdftotext", ["-layout", ff, "-"], { encoding: "utf8" });
    expect(text).toContain(number);
    expect(text).toContain("CheyClean SRL");
    expect(text).toContain("BE 0403.019.261");
    expect(text).toContain("Atelier");
    expect(text).toContain("Entretien de bureaux");
    expect(text).toMatch(/12,5/);
    expect(text).toMatch(/480,00/);
    expect(text).toMatch(/100,80/);
    expect(text).toMatch(/580,80/);
    expect(text).toContain("Bon pour accord");
    expect(text).toContain("Paiement à 30 jours");
    expect(text).not.toMatch(/Aperçu \(non valable\)/);

    // un devis émis est figé ; on peut le dupliquer, l'accepter ou le refuser
    expect((await putQuote(req(`/api/admin/quotes/${qid}`, { method: "PUT", body: { ...body, rev: quote.rev }, ...as() }), params({ id: qid }))).status).toBe(409);
    expect((await issue(req(`/api/admin/quotes/${qid}/issue`, { method: "POST", body: {}, ...as() }), params({ id: qid }))).status).toBe(409);
    const dup = await duplicate(req(`/api/admin/quotes/${qid}/duplicate`, { method: "POST", body: {}, ...as() }), params({ id: qid }));
    expect(dup.status).toBe(201);
    const copy = (await get<Quote>("quotes", (await dup.json()).quoteId))!;
    expect(copy.status).toBe("draft");
    expect(copy.replaces).toBe(qid);
    expect((await quoteStatus(req(`/api/admin/quotes/${qid}/status`, { method: "POST", body: { to: "draft" }, ...as() }), params({ id: qid }))).status).toBe(400);
    expect((await quoteStatus(req(`/api/admin/quotes/${qid}/status`, { method: "POST", body: { to: "accepted" }, ...as() }), params({ id: qid }))).status).toBe(200);
    expect((await get<Quote>("quotes", qid))?.status).toBe("accepted");
    expect((await quoteStatus(req(`/api/admin/quotes/${qid}/status`, { method: "POST", body: { to: "declined" }, ...as() }), params({ id: qid }))).status).toBe(409);

    // la liste reflète le devis
    const row = (await listRows()).find((x) => x.request.id === r.id)!;
    expect(row.status).toBe("quoted");
    expect(row.quotes).toHaveLength(2);
  });

  it("valide les réglages : numéro de TVA, IBAN, taux et prix invalides sont refusés avec un message", async () => {
    const { cookie, csrf } = await session();
    const put = (name: string, body: unknown) => putSettings(req(`/api/admin/settings/${name}`, { method: "PUT", body, cookie, csrf }), params({ name }));
    const seller = { legalName: "X SRL", legalForm: "", street: "Rue 1", postalCode: "1000", city: "Bruxelles", country: "Belgique", vatNumber: "BE 0403.019.261", iban: "", email: "", phone: "" };
    const badVat = await put("company", { seller: { ...seller, vatNumber: "BE 0403.019.262" }, quoteTerms: "", defaultValidDays: 30 });
    expect(badVat.status).toBe(400);
    expect(JSON.stringify(await badVat.json())).toMatch(/n'est pas valide/);
    expect((await put("company", { seller: { ...seller, iban: "BE00 0000 0000 0000" }, quoteTerms: "", defaultValidDays: 30 })).status).toBe(400);
    expect((await put("company", { seller: { ...seller, legalName: "" }, quoteTerms: "", defaultValidDays: 30 })).status).toBe(400);
    expect((await put("company", { seller, quoteTerms: "", defaultValidDays: 0 })).status).toBe(400);
    expect((await put("vat", { rates: [{ id: "a-b", label: "x", ratePercent: 150 }] })).status).toBe(400);
    expect((await put("vat", { rates: [{ id: "A B", label: "x", ratePercent: 5 }] })).status).toBe(400);
    expect((await put("catalog", { items: [{ id: "item-x", label: "x", unit: "h", unitPriceCents: -5, vatRateId: "a-b" }] })).status).toBe(400);
    expect((await put("catalog", { items: [{ id: "item-x", label: "x", unit: "h", unitPriceCents: 12.5, vatRateId: "a-b" }] })).status).toBe(400);
    expect((await put("inconnu", {})).status).toBe(404);
    // une révision périmée est refusée
    const keep = { id: "taux-test", label: "Taux de test", ratePercent: 21 };
    const orphan = await put("vat", { rates: [] }); // « taux-test » est utilisé par le catalogue : suppression refusée
    expect(orphan.status).toBe(400);
    expect(JSON.stringify(await orphan.json())).toMatch(/ne peut pas être supprimé/);
    const first = await (await put("vat", { rates: [keep, { id: "taux-b", label: "B", ratePercent: 6 }] })).json();
    expect((await put("vat", { rates: [keep], rev: first.rev + 5 })).status).toBe(409);
  });
});
