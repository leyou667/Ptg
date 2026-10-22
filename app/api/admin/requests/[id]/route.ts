import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/service";
import { addNote, findRequest, REQUEST_STATUSES, setStatus } from "@/lib/requests/store";
import { isValidId } from "@/lib/storage";

export const runtime = "nodejs";

const patch = z.object({
  status: z.enum(REQUEST_STATUSES as [string, ...string[]]).optional(),
  note: z.string().trim().min(1, "La note est vide.").max(2000, "Note trop longue (2000 caractères).").optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    if (!isValidId("requests", id)) return Response.json({ error: "not_found" }, { status: 404 });
    const body = patch.parse(await req.json());
    let record = await findRequest(id);
    if (!record) return Response.json({ error: "not_found" }, { status: 404 });
    if (body.status) record = await setStatus(record, body.status as never);
    if (body.note) record = await addNote(record, body.note);
    return Response.json({ ok: true, status: record.status, notes: record.notes ?? [] }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
