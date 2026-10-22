import { mkdir, readFile, rename, writeFile, open } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Stockage durable sur disque : un fichier JSON par document, écrit de façon atomique (fichier temporaire puis renommage).
 * Trois collections strictement séparées : demandes de devis, devis, factures définitives.
 *
 * Sur un hébergement sans disque persistant (par exemple Vercel), définir DATA_DIR vers un volume persistant
 * ou remplacer ce module par une base de données : l'interface (put / get / list) reste la même.
 */
export type Collection = "requests" | "quotes" | "invoices";

export class StorageUnavailableError extends Error {
  constructor(message = "Aucun stockage durable n'est configuré.") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export function dataDir() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
}

/** Faux si le disque est éphémère ou en lecture seule (plateformes serverless) et qu'aucun DATA_DIR n'est fourni. */
export function storageConfigured() {
  if (process.env.DATA_DIR) return true;
  return !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
}

const ID = /^[A-Z]{3}-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/;
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function newId(prefix: "DEV" | "QUO" | "FAC", now = new Date()) {
  const bytes = randomBytes(6);
  const tail = Array.from(bytes, (b) => ALPHABET[b % 32]).join("");
  return `${prefix}-${String(now.getUTCFullYear() % 100).padStart(2, "0")}${String(now.getUTCMonth() + 1).padStart(2, "0")}-${tail}`;
}

export function isValidId(id: string) {
  return ID.test(id);
}

function fileFor(collection: Collection, id: string) {
  if (!isValidId(id)) throw new Error("Identifiant invalide.");
  return path.join(dataDir(), collection, `${id}.json`);
}

/** Écrit un nouveau document. Échoue s'il existe déjà (jamais d'écrasement silencieux). */
export async function create<T extends { id: string }>(collection: Collection, doc: T) {
  if (!storageConfigured()) throw new StorageUnavailableError();
  const file = fileFor(collection, doc.id);
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(doc, null, 2), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

/** Remplace un document existant de façon atomique. */
export async function replace<T extends { id: string }>(collection: Collection, doc: T) {
  if (!storageConfigured()) throw new StorageUnavailableError();
  const file = fileFor(collection, doc.id);
  const tmp = `${file}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(tmp, JSON.stringify(doc, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, file);
}

export async function get<T>(collection: Collection, id: string): Promise<T | null> {
  if (!storageConfigured() || !isValidId(id)) return null;
  try {
    return JSON.parse(await readFile(fileFor(collection, id), "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/**
 * Compteur séquentiel sans trou, protégé par un verrou de fichier : sert à numéroter les factures définitives,
 * dont la numérotation doit être continue.
 */
export async function nextSequence(name: string, year: number): Promise<number> {
  if (!storageConfigured()) throw new StorageUnavailableError();
  const dir = path.join(dataDir(), "counters");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, `${name}-${year}.txt`);
  const lock = `${file}.lock`;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const l = await open(lock, "wx");
      await l.close();
      try {
        let current = 0;
        try {
          current = Number((await readFile(file, "utf8")).trim()) || 0;
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        }
        const next = current + 1;
        const tmp = `${file}.tmp`;
        await writeFile(tmp, String(next), "utf8");
        await rename(tmp, file);
        return next;
      } finally {
        const { unlink } = await import("node:fs/promises");
        await unlink(lock).catch(() => {});
      }
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      await new Promise((r) => setTimeout(r, 20 + attempt * 5));
    }
  }
  throw new Error("Compteur verrouillé trop longtemps.");
}
