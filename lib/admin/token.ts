/**
 * Jetons de session signés (HMAC-SHA256), avec Web Crypto : le même code sert dans le proxy et dans les routes.
 * Le jeton ne contient aucune donnée personnelle : un identifiant de session aléatoire et deux dates.
 */
export type SessionPayload = { sid: string; iat: number; exp: number };

const enc = new TextEncoder();
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signSession(secret: string, payload: SessionPayload): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), enc.encode(body)));
  return `${body}.${b64u(sig)}`;
}

/** Retourne la charge utile si la signature est exacte et que le jeton n'est pas expiré ; sinon null. */
export async function verifySession(secret: string, token: string | undefined | null, nowMs = Date.now()): Promise<SessionPayload | null> {
  if (!secret || !token || token.length > 1024) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  try {
    // verify() compare en temps constant
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), fromB64u(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64u(body))) as SessionPayload;
    if (typeof p.sid !== "string" || typeof p.exp !== "number" || typeof p.iat !== "number") return null;
    if (p.exp * 1000 <= nowMs || p.iat * 1000 > nowMs + 60_000) return null;
    return p;
  } catch {
    return null;
  }
}

/** Jeton anti-CSRF lié à la session : sans la session, il ne peut pas être calculé. */
export async function csrfFor(secret: string, sid: string): Promise<string> {
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), enc.encode(`csrf:${sid}`)));
  return b64u(sig);
}

export async function csrfMatches(secret: string, sid: string, given: string | null): Promise<boolean> {
  if (!given || given.length > 200) return false;
  const expected = await csrfFor(secret, sid);
  if (expected.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
