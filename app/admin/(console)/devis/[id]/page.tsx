import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteActions } from "@/components/admin/QuoteActions";
import { QuoteEditor } from "@/components/admin/QuoteEditor";
import { QuoteBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin/auth";
import { blockersFor } from "@/lib/admin/service";
import { loadBillingDeps } from "@/lib/billing/settings";
import type { Quote } from "@/lib/billing/types";
import { buyerFromRequest } from "@/lib/billing/workflow";
import { formatCents } from "@/lib/money";
import { findRequest } from "@/lib/requests/store";
import { get, isValidId } from "@/lib/storage";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Intl.DateTimeFormat("fr-BE", { dateStyle: "long", timeZone: "Europe/Brussels" }).format(new Date(iso));

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { csrf } = await requireAdmin();
  const { id } = await params;
  if (!isValidId("quotes", id)) notFound();
  const quote = await get<Quote>("quotes", id);
  if (!quote) notFound();
  const request = await findRequest(quote.requestId);
  if (!request) notFound();
  const buyer = buyerFromRequest(request);
  const deps = await loadBillingDeps();
  const title = quote.number ? `Devis ${quote.number}` : "Brouillon de devis";

  return (
    <AdminShell active="/admin" csrf={csrf}>
      <Link href={`/admin/demandes/${request.id}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
        Retour à la demande de {buyer.name}
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>{title}</h1>
          <p className="soft mt-2">
            {buyer.name} · {request.id}
            {quote.replaces ? " · nouvelle version" : ""}
          </p>
        </div>
        <QuoteBadge status={quote.status} />
      </div>

      <div className="mt-10">
        {quote.status === "draft" ? (
          <QuoteEditor
            quoteId={quote.id}
            rev={quote.rev ?? 1}
            csrf={csrf}
            initial={{ subject: quote.subject, notes: quote.notes, validDays: quote.validDays, lines: quote.lines }}
            catalog={deps.catalog}
            vatRates={deps.vatRates}
            blockers={await blockersFor(quote)}
          />
        ) : (
          <div className="grid gap-8">
            <section className="panel p-6" aria-labelledby="recap-titre">
              <h2 id="recap-titre" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {quote.subject}
              </h2>
              <p className="small soft mt-1">
                Émis le {quote.sentAt ? when(quote.sentAt) : "—"}
                {quote.validUntil ? `, valable jusqu'au ${when(quote.validUntil)}` : ""}.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead>
                    <tr className="small soft">
                      {["Désignation", "Qté", "Unité", "PU HT", "Total HT"].map((h) => (
                        <th key={h} scope="col" className="py-2 pr-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lines.map((l, i) => (
                      <tr key={i} className="align-top">
                        <td className="py-2 pr-4">
                          {l.label}
                          {l.description && <p className="small soft">{l.description}</p>}
                        </td>
                        <td className="py-2 pr-4">{l.quantity}</td>
                        <td className="py-2 pr-4">{l.unit}</td>
                        <td className="py-2 pr-4">{formatCents(l.unitPriceCents ?? 0)}</td>
                        <td className="py-2">{quote.totals ? formatCents(quote.totals.lines[i].netCents) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {quote.totals && (
                <dl className="mt-5 grid max-w-sm gap-1 md:ml-auto">
                  <div className="flex justify-between gap-4">
                    <dt>Total hors TVA</dt>
                    <dd className="font-semibold">{formatCents(quote.totals.netCents)}</dd>
                  </div>
                  {quote.totals.vatByRate.map((v) => (
                    <div key={v.vatRateId} className="small flex justify-between gap-4">
                      <dt className="soft">
                        TVA {v.ratePercent} % sur {formatCents(v.baseCents)}
                      </dt>
                      <dd>{formatCents(v.vatCents)}</dd>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between gap-4 bg-ink p-3 text-white">
                    <dt className="font-semibold">Total TTC</dt>
                    <dd className="font-bold">{formatCents(quote.totals.grossCents)}</dd>
                  </div>
                </dl>
              )}
              {quote.notes && <p className="mt-5 whitespace-pre-line">{quote.notes}</p>}
              <p className="small soft mt-4">Ce devis est figé. Pour le modifier, dupliquez-le en nouvelle version.</p>
            </section>
            <QuoteActions quoteId={quote.id} csrf={csrf} status={quote.status} hasInvoice={Boolean(quote.invoiceId)} />
          </div>
        )}
      </div>
    </AdminShell>
  );
}
