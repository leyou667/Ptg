import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/service";
import { transitionQuote } from "@/lib/billing/workflow";
import type { Quote } from "@/lib/billing/types";
import { get, isValidId, replace } from "@/lib/storage";

export const runtime = "nodejs";

const body = z.object({ to: z.enum(["accepted", "declined", "expired"]) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { id } = await ctx.params;
    const quote = isValidId("quotes", id) ? await get<Quote>("quotes", id) : null;
    if (!quote) return Response.json({ error: "not_found" }, { status: 404 });
    const { to } = body.parse(await req.json());
    const saved = await replace("quotes", transitionQuote(quote, to));
    return Response.json({ ok: true, status: saved.status }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
