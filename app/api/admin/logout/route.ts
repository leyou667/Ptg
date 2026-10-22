import { clearedCookies, sameOrigin, sessionFromRequest } from "@/lib/admin/auth";
import { revokeSession } from "@/lib/admin/revocation";

export const runtime = "nodejs";

/** Déconnexion réelle : le cookie est effacé ET la session est révoquée côté serveur (un cookie copié ne marche plus). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "bad_origin" }, { status: 403 });
  const session = await sessionFromRequest(req);
  if (session) {
    try {
      await revokeSession(session.sid, session.exp);
    } catch (e) {
      console.error("[admin] révocation impossible :", e instanceof Error ? e.message : e);
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  }
  const headers = new Headers({ "cache-control": "no-store" });
  for (const c of clearedCookies()) headers.append("set-cookie", c);
  return Response.json({ ok: true }, { status: 200, headers });
}
