import { findRequest, tokenMatches } from "@/lib/requests/store";
import { buildRequestPdf } from "@/lib/pdf/request-summary";
import { isValidId } from "@/lib/storage";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!rateLimit(`pdf:${clientIp(req)}`, 30, 10 * 60_000).ok) return new Response("Trop de requêtes.", { status: 429 });
  // Même réponse pour « introuvable » et « jeton faux » : on ne révèle pas quelles références existent.
  const notFound = () => new Response("Document introuvable.", { status: 404 });
  if (!isValidId("requests", id) || token.length < 16) return notFound();
  const record = await findRequest(id);
  if (!record || !tokenMatches(record, token)) return notFound();
  const pdf = await buildRequestPdf(record);
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="demande-${record.id}.pdf"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
