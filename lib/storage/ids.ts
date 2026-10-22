import { randomBytes } from "node:crypto";
import type { Collection } from "./types";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newId(prefix: "DEV" | "QUO" | "FAC", now = new Date()) {
  const bytes = randomBytes(6);
  const tail = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  return `${prefix}-${String(now.getUTCFullYear() % 100).padStart(2, "0")}${String(now.getUTCMonth() + 1).padStart(2, "0")}-${tail}`;
}

const PATTERNS: Record<Collection, RegExp> = {
  requests: /^DEV-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/,
  quotes: /^QUO-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/,
  invoices: /^FAC-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/,
  settings: /^(catalog|vat|company|revoked)$/,
};

/** Un identifiant n'est jamais utilisé tel quel dans un chemin ou une requête avant d'avoir passé ce contrôle. */
export function isValidId(collection: Collection, id: string) {
  return typeof id === "string" && PATTERNS[collection].test(id);
}
