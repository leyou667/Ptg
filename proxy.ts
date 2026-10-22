import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/admin/token";

/**
 * Première barrière : toute requête vers /admin ou /api/admin sans session valide est refusée ici, avant d'atteindre
 * la moindre page ou route. Les pages et les routes revérifient la session elles-mêmes : cette barrière seule ne suffirait pas.
 */
const PUBLIC = new Set(["/admin/login", "/api/admin/login"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.has(pathname)) return NextResponse.next();

  const token = req.cookies.get("__Host-cc_admin")?.value ?? req.cookies.get("cc_admin")?.value;
  const session = await verifySession(process.env.ADMIN_SESSION_SECRET ?? "", token);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
