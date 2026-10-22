import { randomBytes, timingSafeEqual } from "node:crypto";
import { create, get, list, newId, replace } from "@/lib/storage";
import type { Doc } from "@/lib/storage/types";
import type { RequestData, RequestFields } from "./schema";

/**
 * Une DEMANDE DE DEVIS : ce que le client a déclaré. Ce n'est ni un devis (qui porte des prix) ni une facture.
 * Son statut décrit seulement son traitement ; un devis est un autre document (lib/billing).
 */
import { REQUEST_STATUSES, type RequestStatus } from "./status";
export { REQUEST_STATUSES };
export type { RequestStatus };

export type StoredRequest = Doc & {
  id: string;
  kind: "quote-request";
  schemaVersion: 1;
  /** "received" est l'ancien nom de « new » (demandes enregistrées avant l'administration). */
  status: RequestStatus | "received";
  createdAt: string;
  updatedAt?: string;
  /** Jeton remis au client pour retélécharger son récapitulatif ; jamais exposé ailleurs. */
  accessToken: string;
  data: RequestFields;
  consentAt: string;
  statusHistory?: { status: RequestStatus; at: string }[];
  notes?: { at: string; text: string }[];
};

export const statusOf = (r: Pick<StoredRequest, "status">): RequestStatus => (r.status === "received" ? "new" : r.status);

export async function saveRequest(data: RequestData, now = new Date()): Promise<StoredRequest> {
  const { consent: _consent, website: _website, ...rest } = data;
  void _consent;
  void _website;
  for (let attempt = 0; attempt < 5; attempt++) {
    const record: StoredRequest = {
      id: newId("DEV", now),
      kind: "quote-request",
      schemaVersion: 1,
      status: "new",
      createdAt: now.toISOString(),
      accessToken: randomBytes(24).toString("hex"),
      data: rest as RequestFields,
      consentAt: now.toISOString(),
      statusHistory: [{ status: "new", at: now.toISOString() }],
      notes: [],
    };
    try {
      return await create("requests", record);
    } catch (e) {
      if ((e as { code?: string }).code !== "EEXIST") throw e;
    }
  }
  throw new Error("Impossible de générer une référence unique.");
}

export const findRequest = (id: string) => get<StoredRequest>("requests", id);
export const listRequests = () => list<StoredRequest>("requests");

export function tokenMatches(record: StoredRequest, token: string) {
  const a = Buffer.from(record.accessToken);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Change le statut (avec historique). Sans effet si le statut est déjà celui-là. */
export async function setStatus(record: StoredRequest, status: RequestStatus, now = new Date()): Promise<StoredRequest> {
  if (statusOf(record) === status) return record;
  const at = now.toISOString();
  return replace("requests", { ...record, status, updatedAt: at, statusHistory: [...(record.statusHistory ?? []), { status, at }] });
}

export async function addNote(record: StoredRequest, text: string, now = new Date()): Promise<StoredRequest> {
  const at = now.toISOString();
  return replace("requests", { ...record, updatedAt: at, notes: [...(record.notes ?? []), { at, text }] });
}
