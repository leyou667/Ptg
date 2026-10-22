"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { QuoteStatus } from "@/lib/billing/types";
import { adminCall } from "./api";

export function QuoteActions({ quoteId, csrf, status, hasInvoice }: { quoteId: string; csrf: string; status: QuoteStatus; hasInvoice: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"accepted" | "declined" | "expired" | null>(null);

  async function setStatus(to: "accepted" | "declined" | "expired") {
    setBusy(true);
    setError(null);
    const r = await adminCall(`/api/admin/quotes/${quoteId}/status`, "POST", csrf, { to });
    setBusy(false);
    setConfirm(null);
    if (r.ok) router.refresh();
    else setError(r.message);
  }

  async function duplicate() {
    setBusy(true);
    setError(null);
    const r = await adminCall<{ quoteId: string }>(`/api/admin/quotes/${quoteId}/duplicate`, "POST", csrf);
    if (r.ok) router.push(`/admin/devis/${r.data.quoteId}`);
    else {
      setBusy(false);
      setError(r.message);
    }
  }

  const labels = { accepted: "Marquer comme accepté", declined: "Marquer comme refusé", expired: "Marquer comme expiré" } as const;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-3">
        <a href={`/api/admin/quotes/${quoteId}/pdf`} className="btn btn-primary">
          Télécharger le PDF du devis
        </a>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={duplicate}>
          Dupliquer en nouvelle version
        </button>
      </div>
      {status === "sent" && (
        <div>
          <p className="small soft mb-2">Quand le client répond, enregistrez sa décision :</p>
          <div className="flex flex-wrap gap-2">
            {(["accepted", "declined", "expired"] as const).map((to) =>
              confirm === to ? (
                <span key={to} className="flex items-center gap-2">
                  <button type="button" className="btn btn-primary min-h-11 py-2" disabled={busy} onClick={() => setStatus(to)}>
                    Confirmer
                  </button>
                  <button type="button" className="btn btn-ghost min-h-11 py-2" onClick={() => setConfirm(null)}>
                    Annuler
                  </button>
                </span>
              ) : (
                <button key={to} type="button" className="btn btn-ghost min-h-11 py-2" disabled={busy} onClick={() => setConfirm(to)}>
                  {labels[to]}
                </button>
              ),
            )}
          </div>
        </div>
      )}
      {status === "accepted" && (
        <p className="small soft">{hasInvoice ? "Une facture a déjà été émise pour ce devis." : "Devis accepté. L'émission des factures définitives n'est pas encore disponible dans l'administration."}</p>
      )}
      {error && (
        <p role="alert" className="erreur">
          {error}
        </p>
      )}
    </div>
  );
}
