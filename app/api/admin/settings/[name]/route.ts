import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/service";
import { catalogSchema, companySchema, loadBillingDeps, saveCatalog, saveCompany, saveVat, vatSchema } from "@/lib/billing/settings";

export const runtime = "nodejs";

const rev = z.object({ rev: z.number().int().min(1).optional() });

export async function PUT(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const g = await requireAdminApi(req);
  if (g instanceof Response) return g;
  try {
    const { name } = await ctx.params;
    const raw = await req.json();
    if (name === "catalog") {
      const { rev: r } = rev.parse(raw);
      const items = catalogSchema.parse(raw).items;
      const known = new Set((await loadBillingDeps()).vatRates.map((x) => x.id));
      const unknown = items.find((i) => !known.has(i.vatRateId));
      if (unknown) return Response.json({ error: "invalid", fields: [{ path: "items", message: `« ${unknown.label} » utilise un taux de TVA qui n'existe pas. Enregistrez d'abord vos taux.` }] }, { status: 400 });
      const saved = await saveCatalog(items, r);
      return Response.json({ ok: true, rev: saved.rev }, { headers: { "cache-control": "no-store" } });
    }
    if (name === "vat") {
      const { rev: r } = rev.parse(raw);
      const rates = vatSchema.parse(raw).rates;
      const ids = new Set(rates.map((x) => x.id));
      const orphan = (await loadBillingDeps()).catalog.find((i) => !ids.has(i.vatRateId));
      if (orphan) return Response.json({ error: "invalid", fields: [{ path: "rates", message: `Le taux utilisé par « ${orphan.label} » ne peut pas être supprimé : changez d'abord le taux de cette prestation.` }] }, { status: 400 });
      const saved = await saveVat(rates, r);
      return Response.json({ ok: true, rev: saved.rev }, { headers: { "cache-control": "no-store" } });
    }
    if (name === "company") {
      const { rev: r } = rev.parse(raw);
      const saved = await saveCompany(companySchema.parse(raw), r);
      return Response.json({ ok: true, rev: saved.rev }, { headers: { "cache-control": "no-store" } });
    }
    return Response.json({ error: "not_found" }, { status: 404 });
  } catch (e) {
    return errorResponse(e);
  }
}
