import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse, quotePdf } from "@/lib/admin/service";
import type { Quote } from "@/lib/billing/types";
import { get, isValidId } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    const quote = isValidId("quotes", id) ? await get<Quote>("quotes", id) : null;
    if (!quote) return Response.json({ error: "not_found" }, { status: 404 });
    const r = await quotePdf(quote);
    // Informations manquantes : on dit lesquelles, on ne produit pas de PDF incomplet.
    if ("blockers" in r) return Response.json({ error: "blocked", blockers: r.blockers }, { status: 409, headers: { "cache-control": "no-store" } });
    const name = quote.number ? `devis-${quote.number}` : `apercu-${quote.id}`;
    return new Response(Buffer.from(r.pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${name}.pdf"`, "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
