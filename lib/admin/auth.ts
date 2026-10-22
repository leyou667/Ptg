import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRevoked } from "./revocation";
import { csrfFor, csrfMatches, signSession, verifySession, type SessionPayload } from "./token";

/**
 * Accès à l'administration. Trois protections indépendantes, chacune suffisante pour refuser un inconnu :
 *  1. le proxy (proxy.ts) refuse toute requête /admin ou /api/admin sans session valide ;
 *  2. chaque page et chaque route vérifie la session elle-même (le proxy n'est jamais l'unique barrière) ;
 *  3. toute modification exige en plus un jeton anti-CSRF et une origine identique au site.
 * L'administration est désactivée tant que ADMIN_PASSWORD_HASH et ADMIN_SESSION_SECRET ne sont pas définis.
 */
export const COOKIE_SECURE = "__Host-cc_admin";
export const COOKIE_PLAIN = "cc_admin";
const SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS) > 0 ? Number(process.env.ADMIN_SESSION_HOURS) : 8;

export const adminSecret = () => process.env.ADMIN_SESSION_SECRET ?? "";
export const adminPasswordHash = () => process.env.ADMIN_PASSWORD_HASH ?? "";

export function adminConfigured() {
  return adminSecret().length >= 32 && adminPasswordHash().startsWith("scrypt:");
}

const json = (body: unknown, status: number, headers?: Record<string, string>) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

export const isSecureRequest = (req: Request) => new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

export async function newSessionCookie(secure: boolean) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sid: randomBytes(16).toString("hex"), iat: now, exp: now + SESSION_HOURS * 3600 };
  const token = await signSession(adminSecret(), payload);
  const name = secure ? COOKIE_SECURE : COOKIE_PLAIN;
  const attrs = ["Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${SESSION_HOURS * 3600}`, ...(secure ? ["Secure"] : [])];
  return { cookie: `${name}=${token}; ${attrs.join("; ")}`, csrf: await csrfFor(adminSecret(), payload.sid) };
}

export function clearedCookies() {
  return [
    `${COOKIE_SECURE}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`,
    `${COOKIE_PLAIN}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  ];
}

export async function sessionFromRequest(req: Request): Promise<SessionPayload | null> {
  if (!adminConfigured()) return null;
  const header = req.headers.get("cookie");
  const token = readCookie(header, COOKIE_SECURE) ?? readCookie(header, COOKIE_PLAIN);
  return verifySession(adminSecret(), token);
}

/** L'origine de la requête doit être celle du site : une page tierce ne peut pas déclencher une modification. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Garde des routes /api/admin. Retourne la session, ou la réponse d'erreur à renvoyer telle quelle. */
export async function requireAdminApi(req: Request, opts: { mutating?: boolean } = {}): Promise<{ session: SessionPayload } | Response> {
  if (!adminConfigured()) return json({ error: "admin_not_configured" }, 503);
  const session = await sessionFromRequest(req);
  if (!session || (await isRevoked(session.sid))) return json({ error: "unauthorized" }, 401);
  const mutating = opts.mutating ?? !["GET", "HEAD"].includes(req.method);
  if (mutating) {
    if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);
    if (!(await csrfMatches(adminSecret(), session.sid, req.headers.get("x-csrf-token")))) return json({ error: "bad_csrf" }, 403);
  }
  return { session };
}

/** Garde des pages /admin (composants serveur). Redirige vers la connexion sans session valide. */
export async function requireAdmin(): Promise<{ sid: string; csrf: string }> {
  if (!adminConfigured()) redirect("/admin/login");
  const jar = await cookies();
  const token = jar.get(COOKIE_SECURE)?.value ?? jar.get(COOKIE_PLAIN)?.value;
  const session = await verifySession(adminSecret(), token);
  if (!session || (await isRevoked(session.sid))) redirect("/admin/login");
  return { sid: session.sid, csrf: await csrfFor(adminSecret(), session.sid) };
}

export async function hasAdminSession(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const jar = await cookies();
  const session = await verifySession(adminSecret(), jar.get(COOKIE_SECURE)?.value ?? jar.get(COOKIE_PLAIN)?.value);
  return Boolean(session) && !(await isRevoked(session!.sid));
}
