import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBadge, RequestBadge } from "@/components/admin/StatusBadge";
import { profileLabel, requestStatusTab } from "@/content/admin";
import { natures } from "@/content/questionnaire";
import { requireAdmin } from "@/lib/admin/auth";
import { listRows, type RequestRow } from "@/lib/admin/service";
import { formatCents } from "@/lib/money";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/requests/store";
import { StorageUnavailableError } from "@/lib/storage";

export const dynamic = "force-dynamic";
const PAGE = 25;

type SP = Promise<{ [k: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const rank: Record<string, number> = { accepted: 4, sent: 3, draft: 2, declined: 1, expired: 1 };
/** Le devis à montrer dans la liste : le plus avancé (accepté, puis émis, puis brouillon), à égalité le plus récent. */
const bestQuote = (row: RequestRow) => [...row.quotes].sort((a, b) => (rank[b.status] - rank[a.status]) || b.createdAt.localeCompare(a.createdAt))[0];

const who = (r: RequestRow["request"]) => (r.data.profile === "societe" ? r.data.companyName : `${r.data.firstName} ${r.data.lastName}`);
const contact = (r: RequestRow["request"]) => (r.data.profile === "societe" ? `${r.data.contactFirstName} ${r.data.contactLastName}` : r.data.email);
const city = (r: RequestRow["request"]) => (r.data.profile === "particulier" ? r.data.city : r.data.siteSameAsBilling ? r.data.billingCity : r.data.siteCity);
const nature = (r: RequestRow["request"]) => natures[r.data.profile].find((n) => n.id === r.data.nature)?.label ?? r.data.nature;
const when = (iso: string) => new Intl.DateTimeFormat("fr-BE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(iso));

function haystack(row: RequestRow) {
  const d = row.request.data;
  const parts = [row.request.id, d.email, d.phone, who(row.request), contact(row.request), city(row.request), d.description, ...row.quotes.map((q) => q.number ?? ""), ...(d.profile === "societe" ? [d.vatNumber, d.companyName] : [])];
  return parts.join(" ").toLowerCase();
}

export default async function AdminHome({ searchParams }: { searchParams: SP }) {
  const { csrf } = await requireAdmin();
  const sp = await searchParams;
  const status = (REQUEST_STATUSES as string[]).includes(one(sp.statut)) ? (one(sp.statut) as RequestStatus) : "";
  const profile = one(sp.profil) === "particulier" || one(sp.profil) === "societe" ? one(sp.profil) : "";
  const q = one(sp.q).trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);

  let rows: RequestRow[] = [];
  let storageError = false;
  try {
    rows = await listRows();
  } catch (e) {
    if (e instanceof StorageUnavailableError) storageError = true;
    else throw e;
  }

  const counts = Object.fromEntries(REQUEST_STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])) as Record<RequestStatus, number>;
  const filtered = rows
    .filter((r) => !status || r.status === status)
    .filter((r) => !profile || r.request.data.profile === profile)
    .filter((r) => !q || q.toLowerCase().split(/\s+/).every((t) => haystack(r).includes(t)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);

  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string> = { statut: status, profil: profile, q, page: String(page) };
    for (const [k, v] of Object.entries({ ...cur, ...over })) if (v && !(k === "page" && v === "1")) p.set(k, v);
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <AdminShell active="/admin" csrf={csrf}>
      <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Demandes</h1>
      <p className="soft mt-2">{rows.length} demande{rows.length > 1 ? "s" : ""} au total.</p>

      {storageError && (
        <p className="panel mt-8 p-5" role="alert">
          Le stockage n&apos;est pas configuré : les demandes ne peuvent pas être lues. Voir le README, « Stockage ».
        </p>
      )}

      <nav aria-label="Filtrer par statut" className="mt-8 flex flex-wrap gap-2">
        <Link href={href({ statut: "", page: "1" })} aria-current={status === "" ? "page" : undefined} className={`btn min-h-11 py-2 ${status === "" ? "btn-primary" : "btn-ghost"}`}>
          Toutes ({rows.length})
        </Link>
        {REQUEST_STATUSES.map((s) => (
          <Link key={s} href={href({ statut: s, page: "1" })} aria-current={status === s ? "page" : undefined} className={`btn min-h-11 py-2 ${status === s ? "btn-primary" : "btn-ghost"}`}>
            {requestStatusTab[s]} ({counts[s]})
          </Link>
        ))}
      </nav>

      <form method="get" action="/admin" className="mt-6 flex flex-wrap items-end gap-3">
        {status && <input type="hidden" name="statut" value={status} />}
        <div className="grow md:max-w-md">
          <label htmlFor="q" className="mb-1 block font-semibold">
            Rechercher
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Nom, société, email, ville, référence, n° de devis…" className="champ" maxLength={100} />
        </div>
        <div>
          <label htmlFor="profil" className="mb-1 block font-semibold">
            Profil
          </label>
          <select id="profil" name="profil" defaultValue={profile} className="champ">
            <option value="">Tous</option>
            <option value="particulier">Particuliers</option>
            <option value="societe">Sociétés</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Filtrer
        </button>
        {(q || profile || status) && (
          <Link href="/admin" className="btn btn-ghost">
            Réinitialiser
          </Link>
        )}
      </form>

      <p className="soft mt-6" role="status">
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        {pages > 1 ? `, page ${page} sur ${pages}` : ""}.
      </p>

      {shown.length === 0 ? (
        <p className="panel mt-4 p-8">{rows.length === 0 ? "Aucune demande reçue pour le moment. Elles apparaîtront ici dès qu'un client enverra un questionnaire." : "Aucune demande ne correspond à ces critères."}</p>
      ) : (
        <>
          {/* Ordinateur : tableau */}
          <table className="mt-4 hidden w-full border-collapse text-left md:table">
            <caption className="sr-only">Demandes reçues</caption>
            <thead>
              <tr className="small soft">
                {["Reçue le", "Client", "Profil", "Besoin", "Statut", "Devis"].map((h) => (
                  <th key={h} scope="col" className="py-3 pr-4 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.request.id} className="align-top transition-colors odd:bg-stone/60 hover:bg-stone">
                  <td className="whitespace-nowrap py-4 pl-3 pr-4">{when(row.request.createdAt)}</td>
                  <td className="py-4 pr-4">
                    <Link href={`/admin/demandes/${row.request.id}`} className="font-bold underline decoration-cyan decoration-2 underline-offset-4">
                      {who(row.request)}
                    </Link>
                    <p className="small soft">{contact(row.request)} · {city(row.request)}</p>
                    <p className="small soft">{row.request.id}</p>
                  </td>
                  <td className="py-4 pr-4">{profileLabel[row.request.data.profile]}</td>
                  <td className="py-4 pr-4">
                    {nature(row.request)}
                    <p className="small soft">
                      {row.request.data.placeType}, {row.request.data.surface} m²
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    <RequestBadge status={row.status} />
                  </td>
                  <td className="py-4 pr-3">
                    {bestQuote(row) ? (
                      <>
                        <QuoteBadge status={bestQuote(row).status} />
                        <p className="small soft mt-1">{bestQuote(row).number ?? "Non numéroté"}</p>
                        {bestQuote(row).totals && <p className="small font-semibold">{formatCents(bestQuote(row).totals!.grossCents)} TTC</p>}
                        {row.quotes.length > 1 && <p className="small soft">{row.quotes.length} devis</p>}
                      </>
                    ) : (
                      <span className="soft">Aucun</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile : cartes */}
          <ul className="mt-4 grid gap-3 md:hidden">
            {shown.map((row) => (
              <li key={row.request.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/admin/demandes/${row.request.id}`} className="text-[1.125rem] font-bold underline decoration-cyan decoration-2 underline-offset-4">
                    {who(row.request)}
                  </Link>
                  <RequestBadge status={row.status} />
                </div>
                <p className="small soft mt-1">
                  {profileLabel[row.request.data.profile]} · {city(row.request)} · {when(row.request.createdAt)}
                </p>
                <p className="mt-2">
                  {nature(row.request)}, {row.request.data.surface} m²
                </p>
                <p className="small soft mt-2">
                  {row.request.id}
                  {bestQuote(row) ? ` · devis ${bestQuote(row).number ?? "brouillon"}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex flex-wrap gap-2">
          {page > 1 && (
            <Link href={href({ page: String(page - 1) })} className="btn btn-ghost">
              Précédente
            </Link>
          )}
          {page < pages && (
            <Link href={href({ page: String(page + 1) })} className="btn btn-ghost">
              Suivante
            </Link>
          )}
        </nav>
      )}
    </AdminShell>
  );
}
