"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { computeTotals, lineProblems } from "@/lib/billing/totals";
import type { CatalogItem, QuoteLine, VatRate } from "@/lib/billing/types";
import { eurosInput, formatCents, parseEuros } from "@/lib/money";
import { adminCall } from "./api";

type UiLine = { key: string; itemId?: string; label: string; description: string; unit: string; quantity: string; price: string; vatRateId: string };

const uid = () => Math.random().toString(36).slice(2, 10);
const toUi = (l: QuoteLine): UiLine => ({ key: uid(), itemId: l.itemId, label: l.label, description: l.description ?? "", unit: l.unit, quantity: String(l.quantity).replace(".", ","), price: eurosInput(l.unitPriceCents), vatRateId: l.vatRateId ?? "" });
const num = (s: string) => {
  const n = Number(s.replace(",", ".").trim());
  return s.trim() !== "" && Number.isFinite(n) ? n : NaN;
};
const toApi = (l: UiLine): QuoteLine => ({
  ...(l.itemId ? { itemId: l.itemId } : {}),
  label: l.label.trim(),
  ...(l.description.trim() ? { description: l.description.trim() } : {}),
  unit: l.unit.trim(),
  quantity: num(l.quantity),
  unitPriceCents: parseEuros(l.price),
  vatRateId: l.vatRateId || null,
});

type Props = {
  quoteId: string;
  rev: number;
  csrf: string;
  initial: { subject: string; notes: string; validDays: number; lines: QuoteLine[] };
  catalog: CatalogItem[];
  vatRates: VatRate[];
  /** Ce qui empêche d'émettre le devis dans son état ENREGISTRÉ (entreprise, client, lignes…). */
  blockers: string[];
};

export function QuoteEditor({ quoteId, rev: initialRev, csrf, initial, catalog, vatRates, blockers: serverBlockers }: Props) {
  const router = useRouter();
  const [rev, setRev] = useState(initialRev);
  const [subject, setSubject] = useState(initial.subject);
  const [notes, setNotes] = useState(initial.notes);
  const [validDays, setValidDays] = useState(String(initial.validDays));
  const [lines, setLines] = useState<UiLine[]>(() => initial.lines.map(toUi));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string; list?: string[] } | null>(null);

  const apiLines = useMemo(() => lines.map(toApi), [lines]);
  const localProblems = useMemo(() => lineProblems(apiLines, vatRates), [apiLines, vatRates]);
  const totals = useMemo(() => {
    try {
      return computeTotals(apiLines, vatRates);
    } catch {
      return null;
    }
  }, [apiLines, vatRates]);
  const partialNet = apiLines.reduce((s, l) => s + (l.unitPriceCents !== null && l.quantity > 0 ? Math.round(l.unitPriceCents * l.quantity) : 0), 0);

  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
    setMessage(null);
    setConfirming(false);
  };
  const patchLine = (key: string, p: Partial<UiLine>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));
    setDirty(true);
    setMessage(null);
    setConfirming(false);
  };
  const addLine = (item?: CatalogItem) => {
    setLines((ls) => [
      ...ls,
      item
        ? { key: uid(), itemId: item.id, label: item.label, description: item.description ?? "", unit: item.unit, quantity: "1", price: eurosInput(item.unitPriceCents), vatRateId: item.vatRateId }
        : { key: uid(), label: "", description: "", unit: "forfait", quantity: "1", price: "", vatRateId: vatRates.length === 1 ? vatRates[0].id : "" },
    ]);
    setDirty(true);
    setConfirming(false);
  };

  async function save(): Promise<boolean> {
    const days = Number(validDays);
    const payload = { subject, notes, validDays: days, lines: apiLines.map((l) => ({ ...l, quantity: Number.isFinite(l.quantity) ? l.quantity : 0 })), rev };
    setBusy(true);
    setMessage(null);
    const r = await adminCall<{ rev: number }>(`/api/admin/quotes/${quoteId}`, "PUT", csrf, payload);
    setBusy(false);
    if (!r.ok) {
      setMessage({ kind: "error", text: r.message });
      return false;
    }
    setRev(r.data.rev);
    setDirty(false);
    setMessage({ kind: "ok", text: "Brouillon enregistré." });
    router.refresh();
    return true;
  }

  async function issue() {
    setBusy(true);
    setMessage(null);
    const r = await adminCall<{ number: string }>(`/api/admin/quotes/${quoteId}/issue`, "POST", csrf);
    setBusy(false);
    if (r.ok) router.refresh();
    else setMessage({ kind: "error", text: r.message, list: r.blockers });
  }

  const shownBlockers = dirty ? localProblems : serverBlockers;
  const canIssue = !dirty && serverBlockers.length === 0;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="min-w-0">
          <label htmlFor="subject" className="mb-2 block font-semibold">
            Objet du devis
          </label>
          <input id="subject" className="champ" value={subject} maxLength={300} onChange={(e) => edit(setSubject)(e.target.value)} />
        </div>
        <div className="min-w-0">
          <label htmlFor="validDays" className="mb-2 block font-semibold">
            Validité (jours)
          </label>
          <input id="validDays" className="champ" inputMode="numeric" value={validDays} onChange={(e) => edit(setValidDays)(e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>

      <section aria-labelledby="lignes-titre">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
          <h2 id="lignes-titre" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Prestations
          </h2>
          <div className="flex min-w-0 max-w-full flex-wrap gap-2">
            {catalog.length > 0 && (
              <>
                <label htmlFor="add-catalog" className="sr-only">
                  Ajouter une prestation du catalogue
                </label>
                <select
                  id="add-catalog"
                  className="champ min-h-11 w-auto max-w-full py-1"
                  value=""
                  onChange={(e) => {
                    const item = catalog.find((c) => c.id === e.target.value);
                    if (item) addLine(item);
                  }}
                >
                  <option value="">Ajouter depuis le catalogue…</option>
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({formatCents(c.unitPriceCents)} / {c.unit})
                    </option>
                  ))}
                </select>
              </>
            )}
            <button type="button" className="btn btn-ghost min-h-11 py-2" onClick={() => addLine()}>
              Ajouter une ligne libre
            </button>
          </div>
        </div>
        {catalog.length === 0 && (
          <p className="small soft mt-2">
            Votre catalogue est vide. Saisissez les lignes à la main ou <Link href="/admin/prestations" className="underline underline-offset-4">créez vos prestations</Link>.
          </p>
        )}
        {vatRates.length === 0 && (
          <p className="small mt-2" role="status">
            Aucun taux de TVA n&apos;est défini : <Link href="/admin/prestations" className="font-semibold underline underline-offset-4">ajoutez-en dans « Prestations et tarifs »</Link> pour pouvoir chiffrer.
          </p>
        )}

        <ul className="mt-5 grid gap-4">
          {lines.map((l, i) => {
            const probs = lineProblems([apiLines[i]], vatRates).filter((p) => !p.includes("aucune ligne"));
            const net = apiLines[i].unitPriceCents !== null && apiLines[i].quantity > 0 ? Math.round(apiLines[i].unitPriceCents! * apiLines[i].quantity) : null;
            return (
              <li key={l.key} className="panel p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label htmlFor={`l-label-${l.key}`} className="small mb-1 block font-semibold">
                      Désignation
                    </label>
                    <input id={`l-label-${l.key}`} className="champ" value={l.label} maxLength={200} onChange={(e) => patchLine(l.key, { label: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`l-qty-${l.key}`} className="small mb-1 block font-semibold">
                      Quantité
                    </label>
                    <input id={`l-qty-${l.key}`} className="champ" inputMode="decimal" value={l.quantity} onChange={(e) => patchLine(l.key, { quantity: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`l-unit-${l.key}`} className="small mb-1 block font-semibold">
                      Unité
                    </label>
                    <input id={`l-unit-${l.key}`} className="champ" value={l.unit} maxLength={20} onChange={(e) => patchLine(l.key, { unit: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`l-price-${l.key}`} className="small mb-1 block font-semibold">
                      Prix unitaire HT (€)
                    </label>
                    <input id={`l-price-${l.key}`} className="champ" inputMode="decimal" placeholder="0,00" value={l.price} onChange={(e) => patchLine(l.key, { price: e.target.value })} />
                  </div>
                  <div className="md:col-span-6">
                    <label htmlFor={`l-desc-${l.key}`} className="small mb-1 block font-semibold">
                      Détail (facultatif)
                    </label>
                    <input id={`l-desc-${l.key}`} className="champ" value={l.description} maxLength={500} onChange={(e) => patchLine(l.key, { description: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <label htmlFor={`l-vat-${l.key}`} className="small mb-1 block font-semibold">
                      TVA
                    </label>
                    <select id={`l-vat-${l.key}`} className="champ" value={l.vatRateId} onChange={(e) => patchLine(l.key, { vatRateId: e.target.value })}>
                      <option value="">Choisir</option>
                      {vatRates.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label} ({r.ratePercent} %)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end justify-between gap-3 md:col-span-3">
                    <p>
                      <span className="small soft block">Total HT</span>
                      <span className="font-bold">{net === null ? "—" : formatCents(net)}</span>
                    </p>
                    <button type="button" className="btn btn-ghost min-h-11 py-2" onClick={() => { setLines((ls) => ls.filter((x) => x.key !== l.key)); setDirty(true); setConfirming(false); }} aria-label={`Supprimer la ligne ${i + 1}`}>
                      Supprimer
                    </button>
                  </div>
                </div>
                {probs.length > 0 && (
                  <ul className="mt-3 grid gap-1" aria-label={`À corriger, ligne ${i + 1}`}>
                    {probs.map((p) => (
                      <li key={p} className="erreur !mt-0">
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        {lines.length === 0 && <p className="soft mt-4">Aucune ligne. Ajoutez au moins une prestation.</p>}
      </section>

      <section aria-labelledby="remarques-titre" className="grid gap-5 md:grid-cols-2">
        <div>
          <h2 id="remarques-titre" className="mb-2" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Remarques pour le client
          </h2>
          <label htmlFor="notes" className="sr-only">
            Remarques
          </label>
          <textarea id="notes" className="champ min-h-28" maxLength={2000} value={notes} onChange={(e) => edit(setNotes)(e.target.value)} placeholder="Accès, horaires, produits, conditions particulières…" />
          <p className="small soft mt-1">Les conditions générales de votre entreprise (page « Entreprise ») s&apos;ajoutent automatiquement.</p>
        </div>
        <div className="panel p-5" aria-live="polite">
          <h2 className="mb-3" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Totaux
          </h2>
          {totals ? (
            <dl className="grid gap-2">
              <div className="flex justify-between gap-4">
                <dt>Total hors TVA</dt>
                <dd className="font-semibold">{formatCents(totals.netCents)}</dd>
              </div>
              {totals.vatByRate.map((v) => (
                <div key={v.vatRateId} className="small flex justify-between gap-4">
                  <dt className="soft">
                    TVA {v.ratePercent} % sur {formatCents(v.baseCents)}
                  </dt>
                  <dd>{formatCents(v.vatCents)}</dd>
                </div>
              ))}
              <div className="mt-2 flex justify-between gap-4 bg-ink p-3 text-white">
                <dt className="font-semibold">Total TTC</dt>
                <dd className="font-bold">{formatCents(totals.grossCents)}</dd>
              </div>
            </dl>
          ) : (
            <p className="soft">
              Total partiel hors TVA : <strong>{formatCents(partialNet)}</strong>. Le total complet s&apos;affiche quand toutes les lignes ont un prix et un taux de TVA.
            </p>
          )}
        </div>
      </section>

      {shownBlockers.length > 0 && (
        <section className="panel p-5" aria-labelledby="restant-titre">
          <h2 id="restant-titre" style={{ fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Pour pouvoir émettre ce devis
          </h2>
          <ul className="mt-3 grid list-disc gap-1 pl-5">
            {shownBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {dirty && <p className="small soft mt-3">Enregistrez le brouillon pour revérifier les informations de votre entreprise et du client.</p>}
        </section>
      )}

      {message && (
        <div role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "erreur text-base" : "small soft"}>
          <p>{message.text}</p>
          {message.list && (
            <ul className="mt-1 list-disc pl-5">
              {message.list.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" disabled={busy || !dirty} onClick={save}>
          {busy ? "Enregistrement…" : "Enregistrer le brouillon"}
        </button>
        {canIssue ? (
          <a href={`/api/admin/quotes/${quoteId}/pdf`} className="btn btn-ghost">
            Aperçu PDF
          </a>
        ) : (
          <button type="button" className="btn btn-ghost" disabled title={dirty ? "Enregistrez d'abord le brouillon." : "Complétez les informations manquantes."}>
            Aperçu PDF
          </button>
        )}
        {!confirming ? (
          <button type="button" className="btn btn-cyan" disabled={busy || !canIssue} onClick={() => setConfirming(true)} title={canIssue ? undefined : dirty ? "Enregistrez d'abord le brouillon." : "Complétez les informations manquantes."}>
            Émettre le devis
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <span className="small font-semibold">Un numéro est attribué et le devis n&apos;est plus modifiable.</span>
            <button type="button" className="btn btn-cyan" disabled={busy} onClick={issue}>
              {busy ? "Émission…" : "Confirmer l'émission"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
              Annuler
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
