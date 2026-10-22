import { adminConfigured, adminPasswordHash, isSecureRequest, newSessionCookie, sameOrigin } from "@/lib/admin/auth";
import { verifyPassword } from "@/lib/admin/password";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const json = (body: unknown, status: number, headers?: Record<string, string>) => Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  if (!adminConfigured()) return json({ error: "admin_not_configured" }, 503);
  if (!sameOrigin(req)) return json({ error: "bad_origin" }, 403);

  // Limitation : par adresse (5 essais / 15 min) et globale (40 essais / h) contre les attaques distribuées.
  const ip = rateLimit(`admin-login:${clientIp(req)}`, 5, 15 * 60_000);
  const all = rateLimit("admin-login:all", 40, 60 * 60_000);
  if (!ip.ok || !all.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(Math.max(ip.retryAfter, all.retryAfter)) });

  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string" && body.password.length <= 200) password = body.password;
  } catch {
    return json({ error: "invalid" }, 400);
  }

  const ok = password.length > 0 && (await verifyPassword(password, adminPasswordHash()));
  if (!ok) {
    await pause(600 + Math.random() * 300); // ralentit les essais, sans révéler s'il y a un identifiant ou non
    return json({ error: "invalid_credentials" }, 401);
  }
  const { cookie, csrf } = await newSessionCookie(isSecureRequest(req));
  return json({ ok: true, csrf }, 200, { "set-cookie": cookie });
}
