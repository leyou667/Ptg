"use client";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string; blockers?: string[]; fields?: { path: string; message: string }[] };

const MESSAGES: Record<string, string> = {
  unauthorized: "Votre session a expiré. Reconnectez-vous.",
  bad_csrf: "Votre session n'est plus valide. Rechargez la page.",
  bad_origin: "Requête refusée.",
  conflict: "Ce document a été modifié entre-temps (autre onglet ou autre personne). Rechargez la page pour voir la dernière version.",
  not_found: "Document introuvable.",
  storage_unavailable: "Le stockage est indisponible. Réessayez dans un instant.",
  forbidden_transition: "Cette action n'est pas possible dans l'état actuel du devis.",
  blocked: "Des informations manquent pour terminer cette action.",
  server_error: "Une erreur est survenue. Réessayez.",
  invalid: "Une valeur n'est pas valide.",
};

/** Appel à l'API d'administration : ajoute le jeton anti-CSRF et traduit les erreurs en messages lisibles. */
export async function adminCall<T = Record<string, unknown>>(url: string, method: "POST" | "PUT" | "PATCH", csrf: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: body === undefined ? "{}" : JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    if (res.status === 401) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu : la session a pris fin
      window.location.href = "/admin/login";
    }
    const fields = Array.isArray(data.fields) ? (data.fields as { path: string; message: string }[]) : undefined;
    return {
      ok: false,
      status: res.status,
      message: data.message ?? fields?.[0]?.message ?? MESSAGES[data.error as string] ?? MESSAGES.server_error,
      blockers: Array.isArray(data.blockers) ? data.blockers : undefined,
      fields,
    };
  } catch {
    return { ok: false, status: 0, message: "Connexion impossible. Vérifiez votre réseau et réessayez." };
  }
}
