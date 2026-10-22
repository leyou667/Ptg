"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestStatusHelp, requestStatusLabel } from "@/content/admin";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/requests/status";
import { adminCall } from "./api";

export function RequestActions({ id, csrf, status, notes }: { id: string; csrf: string; status: RequestStatus; notes: { at: string; text: string }[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function changeStatus(s: RequestStatus) {
    if (s === current || busy) return;
    setBusy(true);
    setMessage(null);
    const r = await adminCall(`/api/admin/requests/${id}`, "PATCH", csrf, { status: s });
    setBusy(false);
    if (r.ok) {
      setCurrent(s);
      setMessage({ kind: "ok", text: `Statut : ${requestStatusLabel[s]}.` });
      router.refresh();
    } else setMessage({ kind: "error", text: r.message });
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const r = await adminCall(`/api/admin/requests/${id}`, "PATCH", csrf, { note });
    setBusy(false);
    if (r.ok) {
      setNote("");
      setMessage({ kind: "ok", text: "Note ajoutée." });
      router.refresh();
    } else setMessage({ kind: "error", text: r.message });
  }

  return (
    <div className="grid gap-8">
      <section aria-labelledby="statut-titre">
        <h2 id="statut-titre" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Statut
        </h2>
        <div role="group" aria-label="Statut de la demande" className="mt-4 flex flex-wrap gap-2">
          {REQUEST_STATUSES.map((s) => (
            <button key={s} type="button" aria-pressed={s === current} disabled={busy} onClick={() => changeStatus(s)} className={`btn min-h-11 py-2 ${s === current ? "btn-primary" : "btn-ghost"}`}>
              {requestStatusLabel[s]}
            </button>
          ))}
        </div>
        <p className="small soft mt-2">{requestStatusHelp[current]}</p>
      </section>

      <section aria-labelledby="notes-titre">
        <h2 id="notes-titre" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Notes internes
        </h2>
        <p className="small soft mt-1">Visibles uniquement ici, jamais par le client.</p>
        {notes.length > 0 && (
          <ul className="mt-4 grid gap-3">
            {[...notes].reverse().map((n) => (
              <li key={n.at + n.text} className="panel p-4">
                <p className="small soft">{new Intl.DateTimeFormat("fr-BE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(n.at))}</p>
                <p className="mt-1 whitespace-pre-line break-words">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addNote} className="mt-4 grid gap-3">
          <label htmlFor="note" className="sr-only">
            Nouvelle note
          </label>
          <textarea id="note" className="champ min-h-24" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Appel passé, précision du client, rendez-vous…" />
          <button type="submit" className="btn btn-ghost justify-self-start" disabled={busy || !note.trim()}>
            Ajouter la note
          </button>
        </form>
      </section>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "erreur" : "small soft"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
