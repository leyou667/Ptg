import { mkdir, open, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { ConflictError, NotFoundError, StorageUnavailableError, type Backend, type Collection, type Doc } from "./types";
import { isValidId } from "./ids";

/**
 * Stockage sur disque : un fichier JSON par document, écrit de façon atomique (fichier temporaire puis renommage).
 * Adapté au développement, à un serveur ou à un volume persistant. Pas adapté à un disque éphémère (Vercel).
 */
export function dataDir() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
}

/** Faux si le disque est éphémère ou en lecture seule (plateformes serverless) et qu'aucun DATA_DIR n'est fourni. */
export function fileStorageConfigured() {
  if (process.env.DATA_DIR) return true;
  return !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME;
}

function fileFor(collection: Collection, id: string) {
  if (!isValidId(collection, id)) throw new Error("Identifiant invalide.");
  return path.join(dataDir(), collection, `${id}.json`);
}

const code = (e: unknown) => (e as NodeJS.ErrnoException).code;

/** Verrou par document : évite que deux écritures simultanées se croisent (lecture, test de révision, écriture). */
async function withLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const lock = `${file}.lock`;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const h = await open(lock, "wx");
      await h.close();
      try {
        return await fn();
      } finally {
        await unlink(lock).catch(() => {});
      }
    } catch (e) {
      if (code(e) !== "EEXIST") throw e;
      await new Promise((r) => setTimeout(r, 15 + attempt * 4));
    }
  }
  throw new Error("Document verrouillé trop longtemps.");
}

async function readDoc<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (e) {
    if (code(e) === "ENOENT") return null;
    throw e;
  }
}

async function writeAtomic(file: string, doc: unknown) {
  const tmp = `${file}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(tmp, JSON.stringify(doc, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tmp, file);
}

export const fileBackend: Backend = {
  kind: "file",

  async create<T extends Doc>(collection: Collection, doc: T) {
    if (!fileStorageConfigured()) throw new StorageUnavailableError();
    const file = fileFor(collection, doc.id);
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const stored = { ...doc, rev: 1 };
    const handle = await open(file, "wx", 0o600); // refuse d'écraser un document existant
    try {
      await handle.writeFile(JSON.stringify(stored, null, 2), "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    return stored;
  },

  async get<T extends Doc>(collection: Collection, id: string) {
    if (!fileStorageConfigured() || !isValidId(collection, id)) return null;
    return readDoc<T>(fileFor(collection, id));
  },

  async replace<T extends Doc>(collection: Collection, doc: T) {
    if (!fileStorageConfigured()) throw new StorageUnavailableError();
    const file = fileFor(collection, doc.id);
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    return withLock(file, async () => {
      const current = await readDoc<Doc>(file);
      if (!current) {
        // Les réglages se créent au premier enregistrement ; les autres documents doivent exister.
        if (collection !== "settings") throw new NotFoundError();
        const created = { ...doc, rev: 1 };
        await writeAtomic(file, created);
        return created;
      }
      if ((current.rev ?? 1) !== (doc.rev ?? 1)) throw new ConflictError();
      const next = { ...doc, rev: (current.rev ?? 1) + 1 };
      await writeAtomic(file, next);
      return next;
    });
  },

  async list<T extends Doc>(collection: Collection) {
    if (!fileStorageConfigured()) throw new StorageUnavailableError();
    let names: string[];
    try {
      names = await readdir(path.join(dataDir(), collection));
    } catch (e) {
      if (code(e) === "ENOENT") return [];
      throw e;
    }
    const docs: T[] = [];
    for (const n of names) {
      if (!n.endsWith(".json")) continue;
      const d = await readDoc<T>(path.join(dataDir(), collection, n));
      if (d) docs.push(d);
    }
    return docs.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  },

  async nextSequence(name: string, year: number) {
    if (!fileStorageConfigured()) throw new StorageUnavailableError();
    if (!/^[a-z-]{3,20}$/.test(name)) throw new Error("Nom de compteur invalide.");
    const dir = path.join(dataDir(), "counters");
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const file = path.join(dir, `${name}-${year}.txt`);
    return withLock(file, async () => {
      let current = 0;
      try {
        current = Number((await readFile(file, "utf8")).trim()) || 0;
      } catch (e) {
        if (code(e) !== "ENOENT") throw e;
      }
      const next = current + 1;
      const tmp = `${file}.tmp`;
      await writeFile(tmp, String(next), "utf8");
      await rename(tmp, file);
      return next;
    });
  },
};
