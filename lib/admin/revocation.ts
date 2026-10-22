import { ConflictError, get, replace } from "@/lib/storage";
import type { Doc } from "@/lib/storage";

/**
 * Révocation des sessions. Un jeton signé est valable jusqu'à son expiration ; pour qu'une déconnexion soit réelle,
 * l'identifiant de session est inscrit ici et refusé ensuite. La liste est purgée de ses entrées expirées à chaque écriture.
 */
type Revoked = Doc & { id: "revoked"; sessions: { sid: string; exp: number }[] };

export async function revokeSession(sid: string, exp: number, nowSec = Math.floor(Date.now() / 1000)) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const cur = await get<Revoked>("settings", "revoked");
    const kept = (cur?.sessions ?? []).filter((s) => s.exp > nowSec && s.sid !== sid);
    try {
      await replace<Revoked>("settings", { id: "revoked", sessions: [...kept, { sid, exp }], rev: cur?.rev });
      return;
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
    }
  }
  throw new Error("Révocation impossible : réessayez.");
}

/** Faux en cas de doute : si le stockage ne répond pas, l'accès est refusé (jamais ouvert par défaut). */
export async function isRevoked(sid: string): Promise<boolean> {
  try {
    const cur = await get<Revoked>("settings", "revoked");
    return Boolean(cur?.sessions.some((s) => s.sid === sid));
  } catch {
    return true;
  }
}
