"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogItem, VatRate } from "@/lib/billing/types";
import { eurosInput, parseEuros } from "@/lib/money";
import { adminCall } from "./api";

type VatRow = { id: string; label: string; rate: string };
type ItemRow = { id: string; label: string; unit: string; price: string; vatRateId: string; description: string };
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const toRate = (s: string) => {
  const n = Number(s.replace(",", ".").trim());
  return s.trim() !== "" && Number.isFinite(n) ? n : NaN;
};

type Msg = { kind: "ok" | "error"; text: string } | null;

export function PrestationsEditor({ csrf, vat, vatRev, catalog, catalogRev }: { csrf: string; vat: VatRate[]; vatRev?: number; catalog: CatalogItem[]; catalogRev?: number }) {
  const router = useRouter();
  const [vRev, setVRev] = useState(vatRev);
  const [cRev, setCRev] = useState(catalogRev);
  const [rates, setRates] = useState<VatRow[]>(vat.map((r) => ({ id: r.id, label: r.label, rate: String(r.ratePercent).replace(".", ",") })));
  const [items, setItems] = useState<ItemRow[]>(catalog.map((c) => ({ id: c.id, label: c.label, unit: c.unit, price: eurosInput(c.unitPriceCents), vatRateId: c.vatRateId, description: c.description ?? "" })));
  const [vMsg, setVMsg] = useState<Msg>(null);
  const [cMsg, setCMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const usedRate = (id: string) => items.find((i) => i.vatRateId === id);

  async function saveVat() {
    const bad = rates.findIndex((r) => !r.label.trim() || Number.isNaN(toRate(r.rate)));
    if (bad >= 0) return setVMsg({ kind: "error", text: `Ligne ${bad + 1} : indiquez un libellé et un pourcentage valides.` });
    setBusy(true);
    setVMsg(null);
    const r = await adminCall<{ rev: number }>("/api/admin/settings/vat", "PUT", csrf, { rates: rates.map((x) => ({ id: x.id, label: x.label.trim(), ratePercent: toRate(x.rate) })), rev: vRev });
    setBusy(false);
    if (r.ok) {
      setVRev(r.data.rev);
      setVMsg({ kind: "ok", text: "Taux de TVA enregistrés." });
      router.refresh();
    } else setVMsg({ kind: "error", text: r.message });
  }

  async function saveCatalog() {
    for (const [i, it] of items.entries()) {
      if (!it.label.trim()) return setCMsg({ kind: "error", text: `Prestation ${i + 1} : indiquez la désignation.` });
      if (!it.unit.trim()) return setCMsg({ kind: "error", text: `Prestation ${i + 1} : indiquez l'unité.` });
      if (parseEuros(it.price) === null) return setCMsg({ kind: "error", text: `Prestation ${i + 1} : indiquez un prix valide, par exemple 35,50.` });
      if (!it.vatRateId) return setCMsg({ kind: "error", text: `Prestation ${i + 1} : choisissez un taux de TVA.` });
    }
    setBusy(true);
    setCMsg(null);
    const r = await adminCall<{ rev: number }>("/api/admin/settings/catalog", "PUT", csrf, {
      items: items.map((x) => ({ id: x.id, label: x.label.trim(), unit: x.unit.trim(), unitPriceCents: parseEuros(x.price), vatRateId: x.vatRateId, ...(x.description.trim() ? { description: x.description.trim() } : {}) })),
      rev: cRev,
    });
    setBusy(false);
    if (r.ok) {
      setCRev(r.data.rev);
      setCMsg({ kind: "ok", text: "Prestations enregistrées. Les devis déjà émis ne changent pas." });
      router.refresh();
    } else setCMsg({ kind: "error", text: r.message });
  }

  const note = (m: Msg) =>
    m && (
      <p role={m.kind === "error" ? "alert" : "status"} className={m.kind === "error" ? "erreur text-base" : "small soft"}>
        {m.text}
      </p>
    );

  return (
    <div className="grid gap-12">
      <section aria-labelledby="tva-titre" className="panel p-6 md:p-8">
        <h2 id="tva-titre" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Taux de TVA
        </h2>
        <p className="soft mt-2 max-w-[60ch]">Ajoutez les taux que vous appliquez. Le choix du taux pour chaque prestation, les exonérations et l&apos;autoliquidation sont à confirmer avec votre comptable : rien n&apos;est prérempli.</p>
        <ul className="mt-5 grid gap-3">
          {rates.map((r, i) => {
            const used = usedRate(r.id);
            return (
              <li key={r.id} className="grid items-end gap-3 md:grid-cols-[1fr_10rem_auto]">
                <div>
                  <label htmlFor={`vat-label-${r.id}`} className="small mb-1 block font-semibold">
                    Libellé
                  </label>
                  <input id={`vat-label-${r.id}`} className="champ" value={r.label} maxLength={80} onChange={(e) => setRates(rates.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                </div>
                <div>
                  <label htmlFor={`vat-rate-${r.id}`} className="small mb-1 block font-semibold">
                    Taux (%)
                  </label>
                  <input id={`vat-rate-${r.id}`} className="champ" inputMode="decimal" value={r.rate} onChange={(e) => setRates(rates.map((x, k) => (k === i ? { ...x, rate: e.target.value } : x)))} />
                </div>
                <button type="button" className="btn btn-ghost min-h-11 py-2" disabled={Boolean(used)} title={used ? `Utilisé par « ${used.label || "une prestation"} »` : undefined} onClick={() => setRates(rates.filter((_, k) => k !== i))}>
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setRates([...rates, { id: rid("taux"), label: "", rate: "" }])}>
            Ajouter un taux
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={saveVat}>
            Enregistrer les taux
          </button>
        </div>
        <div className="mt-3">{note(vMsg)}</div>
      </section>

      <section aria-labelledby="catalogue-titre" className="panel p-6 md:p-8">
        <h2 id="catalogue-titre" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Prestations et prix
        </h2>
        <p className="soft mt-2 max-w-[60ch]">Prix unitaires hors TVA. Ils servent de base pour préparer les devis ; vous pouvez toujours les ajuster ligne par ligne, ou saisir une ligne libre. Modifier le catalogue ne change jamais un devis déjà établi.</p>
        {rates.length === 0 && <p className="mt-4 font-semibold">Ajoutez d&apos;abord un taux de TVA ci-dessus, puis enregistrez-le.</p>}
        <ul className="mt-5 grid gap-4">
          {items.map((it, i) => (
            <li key={it.id} className="bg-ground p-4 md:p-5">
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label htmlFor={`it-label-${it.id}`} className="small mb-1 block font-semibold">
                    Désignation
                  </label>
                  <input id={`it-label-${it.id}`} className="champ" value={it.label} maxLength={120} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={`it-unit-${it.id}`} className="small mb-1 block font-semibold">
                    Unité
                  </label>
                  <input id={`it-unit-${it.id}`} className="champ" placeholder="heure, m², forfait…" value={it.unit} maxLength={20} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, unit: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor={`it-price-${it.id}`} className="small mb-1 block font-semibold">
                    Prix HT (€)
                  </label>
                  <input id={`it-price-${it.id}`} className="champ" inputMode="decimal" placeholder="0,00" value={it.price} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))} />
                </div>
                <div className="md:col-span-3">
                  <label htmlFor={`it-vat-${it.id}`} className="small mb-1 block font-semibold">
                    TVA
                  </label>
                  <select id={`it-vat-${it.id}`} className="champ" value={it.vatRateId} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, vatRateId: e.target.value } : x)))}>
                    <option value="">Choisir</option>
                    {vat.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.ratePercent} %)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-9">
                  <label htmlFor={`it-desc-${it.id}`} className="small mb-1 block font-semibold">
                    Détail (facultatif)
                  </label>
                  <input id={`it-desc-${it.id}`} className="champ" value={it.description} maxLength={300} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)))} />
                </div>
                <div className="flex items-end md:col-span-3">
                  <button type="button" className="btn btn-ghost min-h-11 py-2" onClick={() => setItems(items.filter((_, k) => k !== i))}>
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-ghost" disabled={vat.length === 0} title={vat.length === 0 ? "Enregistrez d'abord au moins un taux de TVA." : undefined} onClick={() => setItems([...items, { id: rid("p"), label: "", unit: "", price: "", vatRateId: vat.length === 1 ? vat[0].id : "", description: "" }])}>
            Ajouter une prestation
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={saveCatalog}>
            Enregistrer les prestations
          </button>
        </div>
        <div className="mt-3">{note(cMsg)}</div>
      </section>
    </div>
  );
}
