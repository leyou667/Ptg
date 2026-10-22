"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminCall } from "./api";

export function CreateQuoteButton({ requestId, csrf, label = "Préparer un devis" }: { requestId: string; csrf: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await adminCall<{ quoteId: string }>(`/api/admin/requests/${requestId}/quotes`, "POST", csrf);
          if (r.ok) router.push(`/admin/devis/${r.data.quoteId}`);
          else {
            setError(r.message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Création…" : label}
      </button>
      {error && (
        <p role="alert" className="erreur">
          {error}
        </p>
      )}
    </div>
  );
}
