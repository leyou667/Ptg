import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse, requestPdf } from "@/lib/admin/service";
import { findRequest } from "@/lib/requests/store";
import { isValidId } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    const record = isValidId("requests", id) ? await findRequest(id) : null;
    if (!record) return Response.json({ error: "not_found" }, { status: 404 });
    return new Response(Buffer.from(await requestPdf(record)), {
      headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="demande-${id}.pdf"`, "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
