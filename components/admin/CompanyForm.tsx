"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Seller } from "@/config/company";
import { adminCall } from "./api";

type Props = { csrf: string; rev?: number; seller: Seller; quoteTerms: string; defaultValidDays: number };

export function CompanyForm({ csrf, rev: initialRev, seller, quoteTerms, defaultValidDays }: Props) {
  const router = useRouter();
  const [rev, setRev] = useState(initialRev);
  const [s, setS] = useState<Seller>(seller);
  const [terms, setTerms] = useState(quoteTerms);
  const [days, setDays] = useState(String(defaultValidDays));
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = (k: keyof Seller) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setErrors({});
    const r = await adminCall<{ rev: number }>("/api/admin/settings/company", "PUT", csrf, { seller: s, quoteTerms: terms, defaultValidDays: Number(days), rev });
    setBusy(false);
    if (r.ok) {
      setRev(r.data.rev);
      setMessage({ kind: "ok", text: "Informations enregistrées." });
      router.refresh();
      return;
    }
    const byField: Record<string, string> = {};
    for (const f of r.fields ?? []) byField[f.path.replace(/^seller\./, "")] ??= f.message;
    setErrors(byField);
    setMessage({ kind: "error", text: r.fields?.length ? "Corrigez les champs signalés." : r.message });
  }

  const field = (k: keyof Seller, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = false) => (
    <div className={span ? "md:col-span-2" : undefined}>
      <label htmlFor={`c-${k}`} className="mb-2 block font-semibold">
        {label}
      </label>
      <input id={`c-${k}`} className="champ" value={s[k]} onChange={set(k)} aria-invalid={errors[k] ? true : undefined} aria-describedby={errors[k] ? `c-${k}-err` : undefined} {...props} />
      {errors[k] && (
        <p id={`c-${k}-err`} role="alert" className="erreur">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={save} noValidate className="grid gap-8">
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        {field("legalName", "Nom légal de l'entreprise", { autoComplete: "organization", maxLength: 120 }, true)}
        {field("legalForm", "Forme juridique (facultatif)", { placeholder: "SRL, SA, indépendant…", maxLength: 40 })}
        {field("vatNumber", "Numéro d'entreprise ou de TVA", { placeholder: "BE 0123.456.789", maxLength: 30 })}
        {field("street", "Rue et numéro", { maxLength: 120 }, true)}
        {field("postalCode", "Code postal", { maxLength: 12 })}
        {field("city", "Ville", { maxLength: 80 })}
        {field("country", "Pays", { maxLength: 60 })}
        {field("iban", "IBAN (facultatif, affiché sur le devis)", { maxLength: 40, placeholder: "BE00 0000 0000 0000" })}
        {field("email", "Email affiché sur le devis (facultatif)", { type: "email", maxLength: 160 })}
        {field("phone", "Téléphone affiché sur le devis (facultatif)", { type: "tel", maxLength: 30 })}
      </div>
      <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor="terms" className="mb-2 block font-semibold">
            Conditions imprimées sur chaque devis
          </label>
          <textarea id="terms" className="champ min-h-32" maxLength={2000} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Modalités de paiement, planification, annulation… (texte libre : à rédiger vous-même)" />
          {errors.quoteTerms && (
            <p role="alert" className="erreur">
              {errors.quoteTerms}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="days" className="mb-2 block font-semibold">
            Validité par défaut (jours)
          </label>
          <input id="days" className="champ" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} aria-invalid={errors.defaultValidDays ? true : undefined} />
          {errors.defaultValidDays && (
            <p role="alert" className="erreur">
              {errors.defaultValidDays}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "erreur !mt-0 text-base" : "small soft"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
