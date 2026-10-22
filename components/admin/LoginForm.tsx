"use client";

import { useState } from "react";

export function LoginForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }), credentials: "same-origin" });
      if (res.ok) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu : l'état de session change
        window.location.href = "/admin";
        return;
      }
      setError(
        res.status === 429
          ? "Trop de tentatives. Patientez quelques minutes avant de réessayer."
          : res.status === 503
            ? "L'administration n'est pas activée sur ce serveur."
            : "Mot de passe incorrect.",
      );
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  if (!configured) {
    return (
      <div className="panel p-6" role="status">
        <p className="font-semibold">L&apos;administration n&apos;est pas activée.</p>
        <p className="soft mt-2">
          Définissez <code>ADMIN_PASSWORD_HASH</code> et <code>ADMIN_SESSION_SECRET</code> (voir le README, « Administration »), puis redémarrez le serveur.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid max-w-md gap-5">
      <div>
        <label htmlFor="admin-password" className="mb-2 block font-semibold">
          Mot de passe
        </label>
        <input id="admin-password" type="password" autoComplete="current-password" className="champ" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined} autoFocus />
        {error && (
          <p id="login-error" role="alert" className="erreur">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary justify-self-start" disabled={busy || password.length === 0}>
        {busy ? "Vérification…" : "Se connecter"}
      </button>
    </form>
  );
}
