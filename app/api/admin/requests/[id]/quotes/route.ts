import { requireAdminApi } from "@/lib/admin/auth";
import { createQuoteForRequest, errorResponse } from "@/lib/admin/service";
import { findRequest } from "@/lib/requests/store";
import { isValidId } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    if (!isValidId("requests", id)) return Response.json({ error: "not_found" }, { status: 404 });
    const request = await findRequest(id);
    if (!request) return Response.json({ error: "not_found" }, { status: 404 });
    const quote = await createQuoteForRequest(request);
    return Response.json({ ok: true, quoteId: quote.id }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
