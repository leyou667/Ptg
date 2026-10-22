"use client";

export function LogoutButton({ csrf }: { csrf: string }) {
  return (
    <button
      type="button"
      className="btn btn-ghost min-h-11 py-2"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST", headers: { "x-csrf-token": csrf }, credentials: "same-origin" });
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu : l'état de session change
        window.location.href = "/admin/login";
      }}
    >
      Se déconnecter
    </button>
  );
}
