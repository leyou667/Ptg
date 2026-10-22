import { createPostgresBackend, poolFromEnv, type Sql } from "./postgres";
import { fileBackend, fileStorageConfigured } from "./file";
import { isValidId, newId } from "./ids";
import { StorageUnavailableError, type Backend, type Collection, type Doc } from "./types";

export { ConflictError, NotFoundError, StorageUnavailableError } from "./types";
export type { Collection, Doc } from "./types";
export { isValidId, newId };
export { dataDir } from "./file";

/**
 * Choix du stockage : DATABASE_URL (PostgreSQL) s'il est défini, sinon les fichiers de DATA_DIR quand le disque
 * est utilisable. Sinon, aucun stockage durable : les écritures sont refusées au lieu d'être simulées.
 */
let pg: (Backend & { ready: () => Promise<void> }) | null = null;
let pgFor: string | undefined;

/** Pour les tests : remplace le client SQL (par exemple pour viser une base de test). */
export function useSql(sql: Sql | null) {
  pg = sql ? createPostgresBackend(sql) : null;
  pgFor = sql ? "custom" : undefined;
}

function backend(): Backend {
  if (pgFor === "custom" && pg) return pg;
  const url = process.env.DATABASE_URL;
  if (url) {
    if (!pg || pgFor !== url) {
      pg = createPostgresBackend(poolFromEnv());
      pgFor = url;
    }
    return pg;
  }
  if (fileStorageConfigured()) return fileBackend;
  throw new StorageUnavailableError();
}

export function storageConfigured() {
  return Boolean(process.env.DATABASE_URL) || pgFor === "custom" || fileStorageConfigured();
}

export function storageKind(): "postgres" | "file" | "none" {
  if (process.env.DATABASE_URL || pgFor === "custom") return "postgres";
  return fileStorageConfigured() ? "file" : "none";
}

export const create = <T extends Doc>(c: Collection, doc: T) => backend().create(c, doc);
export const get = <T extends Doc>(c: Collection, id: string) => (storageConfigured() ? backend().get<T>(c, id) : Promise.resolve(null));
export const replace = <T extends Doc>(c: Collection, doc: T) => backend().replace(c, doc);
export const list = <T extends Doc>(c: Collection) => backend().list<T>(c);
export const nextSequence = (name: string, year: number) => backend().nextSequence(name, year);
