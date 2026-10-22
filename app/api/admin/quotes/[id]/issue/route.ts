import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse, issueForRequest } from "@/lib/admin/service";
import type { Quote } from "@/lib/billing/types";
import { get, isValidId } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    const quote = isValidId("quotes", id) ? await get<Quote>("quotes", id) : null;
    if (!quote) return Response.json({ error: "not_found" }, { status: 404 });
    const issued = await issueForRequest(quote);
    return Response.json({ ok: true, number: issued.number }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
