import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateQuoteButton } from "@/components/admin/CreateQuoteButton";
import { RequestActions } from "@/components/admin/RequestActions";
import { QuoteBadge, RequestBadge } from "@/components/admin/StatusBadge";
import { profileLabel, requestStatusLabel } from "@/content/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { requestWithQuotes } from "@/lib/admin/service";
import { formatCents } from "@/lib/money";
import { describeRequest } from "@/lib/requests/describe";
import { statusOf } from "@/lib/requests/store";
import { isValidId } from "@/lib/storage";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Intl.DateTimeFormat("fr-BE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(iso));

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { csrf } = await requireAdmin();
  const { id } = await params;
  if (!isValidId("requests", id)) notFound();
  const data = await requestWithQuotes(id);
  if (!data) notFound();
  const { request, quotes } = data;
  const status = statusOf(request);
  const d = request.data;
  const title = d.profile === "societe" ? d.companyName : `${d.firstName} ${d.lastName}`;
  const hasDraft = quotes.some((q) => q.status === "draft");

  return (
    <AdminShell active="/admin" csrf={csrf}>
      <Link href="/admin" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
        Toutes les demandes
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>{title}</h1>
          <p className="soft mt-2">
            {profileLabel[d.profile]} · {request.id} · reçue le {when(request.createdAt)}
          </p>
        </div>
        <RequestBadge status={status} />
      </div>

      <div className="grid12 mt-10 gap-y-10">
        <div className="col-span-12 grid gap-6 lg:col-span-7">
          {describeRequest(d).map((g) => (
            <section key={g.title} className="panel p-6" aria-labelledby={`g-${g.title}`}>
              <h2 id={`g-${g.title}`} style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {g.title}
              </h2>
              <dl className="mt-4 grid gap-3">
                {g.rows.map(([k, v]) => (
                  <div key={k} className="grid gap-1 md:grid-cols-[13rem_1fr]">
                    <dt className="small soft font-semibold">{k}</dt>
                    <dd className="break-words whitespace-pre-line">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <p className="small soft">Consentement donné le {when(request.consentAt)}.</p>
          <a href={`/api/admin/requests/${request.id}/pdf`} className="btn btn-ghost justify-self-start">
            Télécharger le récapitulatif (PDF)
          </a>
        </div>

        <div className="col-span-12 grid content-start gap-10 lg:col-span-5">
          <section aria-labelledby="devis-titre" className="panel p-6">
            <h2 id="devis-titre" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Devis
            </h2>
            {quotes.length === 0 ? (
              <p className="soft mt-3">Aucun devis pour cette demande.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/devis/${q.id}`} className="flex flex-wrap items-center justify-between gap-2 bg-ground p-4 transition-colors hover:bg-white">
                      <span>
                        <span className="block font-bold">{q.number ?? "Brouillon"}</span>
                        <span className="small soft">{q.totals ? `${formatCents(q.totals.grossCents)} TTC` : "Pas encore chiffré"}</span>
                      </span>
                      <QuoteBadge status={q.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5">
              <CreateQuoteButton requestId={request.id} csrf={csrf} label={hasDraft ? "Préparer un autre devis" : quotes.length ? "Nouveau devis" : "Préparer un devis"} />
            </div>
          </section>

          <RequestActions id={request.id} csrf={csrf} status={status} notes={request.notes ?? []} />

          <section aria-labelledby="hist-titre">
            <h2 id="hist-titre" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Historique
            </h2>
            <ol className="mt-4 grid gap-2">
              {(request.statusHistory ?? [{ status, at: request.createdAt }]).map((h) => (
                <li key={h.at + h.status} className="small">
                  <span className="soft">{when(h.at)}</span> : {requestStatusLabel[h.status === ("received" as never) ? "new" : h.status]}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
