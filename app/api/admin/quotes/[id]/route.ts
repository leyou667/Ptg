import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/service";
import { draftPatchSchema, updateDraft } from "@/lib/billing/workflow";
import type { Quote } from "@/lib/billing/types";
import { get, isValidId } from "@/lib/storage";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    if (!isValidId("quotes", id)) return Response.json({ error: "not_found" }, { status: 404 });
    const body = draftPatchSchema.extend({ rev: z.number().int().min(1) }).parse(await req.json());
    const quote = await get<Quote>("quotes", id);
    if (!quote) return Response.json({ error: "not_found" }, { status: 404 });
    const { rev, ...patch } = body;
    const saved = await updateDraft({ ...quote, rev }, patch); // rev périmée : refus (409), jamais d'écrasement silencieux
    return Response.json({ ok: true, rev: saved.rev }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
