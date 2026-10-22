import { randomBytes, timingSafeEqual } from "node:crypto";
import { create, get, newId } from "@/lib/storage";
import type { RequestData, RequestFields } from "./schema";

/**
 * Une DEMANDE DE DEVIS : ce que le client a déclaré. Ce n'est ni un devis (qui porte des prix) ni une facture.
 * Le statut ne décrit que la vie de la demande ; un devis est un autre document (lib/billing).
 */
export type StoredRequest = {
  id: string;
  kind: "quote-request";
  schemaVersion: 1;
  status: "received";
  createdAt: string;
  /** Jeton remis au client pour retélécharger son récapitulatif ; jamais exposé ailleurs. */
  accessToken: string;
  data: RequestFields;
  consentAt: string;
};

export async function saveRequest(data: RequestData, now = new Date()): Promise<StoredRequest> {
  const { consent: _consent, website: _website, ...rest } = data;
  void _consent;
  void _website;
  for (let attempt = 0; attempt < 5; attempt++) {
    const record: StoredRequest = {
      id: newId("DEV", now),
      kind: "quote-request",
      schemaVersion: 1,
      status: "received",
      createdAt: now.toISOString(),
      accessToken: randomBytes(24).toString("hex"),
      data: rest as RequestFields,
      consentAt: now.toISOString(),
    };
    try {
      await create("requests", record);
      return record;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
  }
  throw new Error("Impossible de générer une référence unique.");
}

export async function findRequest(id: string) {
  return get<StoredRequest>("requests", id);
}

export function tokenMatches(record: StoredRequest, token: string) {
  const a = Buffer.from(record.accessToken);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
