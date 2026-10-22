import { Pool } from "pg";
import { ConflictError, NotFoundError, type Backend, type Collection, type Doc } from "./types";
import { isValidId } from "./ids";

/**
 * Stockage PostgreSQL : chaque document JSON est conservé tel quel (JSONB) dans une seule table, avec sa révision.
 * Même interface que le stockage fichier ; le modèle de données de l'application ne change pas.
 */
export type Sql = { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }> };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS documents (
     collection text NOT NULL,
     id text NOT NULL,
     rev integer NOT NULL DEFAULT 1,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now(),
     data jsonb NOT NULL,
     PRIMARY KEY (collection, id)
   )`,
  `CREATE INDEX IF NOT EXISTS documents_by_date ON documents (collection, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS counters (
     name text NOT NULL,
     year integer NOT NULL,
     value integer NOT NULL,
     PRIMARY KEY (name, year)
   )`,
];

export function createPostgresBackend(sql: Sql): Backend & { ready: () => Promise<void> } {
  let ready: Promise<void> | null = null;
  const init = () => (ready ??= (async () => {
    for (const statement of SCHEMA) await sql.query(statement);
  })().catch((e) => {
    ready = null; // on réessaiera au prochain appel
    throw e;
  }));

  const withRev = <T extends Doc>(data: unknown, rev: number): T => ({ ...(data as T), rev });

  return {
    kind: "postgres",
    ready: init,

    async create<T extends Doc>(collection: Collection, doc: T) {
      await init();
      if (!isValidId(collection, doc.id)) throw new Error("Identifiant invalide.");
      const stored = { ...doc, rev: 1 };
      try {
        await sql.query("INSERT INTO documents (collection, id, rev, created_at, data) VALUES ($1, $2, 1, COALESCE($3::timestamptz, now()), $4::jsonb)", [
          collection,
          doc.id,
          doc.createdAt ?? null,
          JSON.stringify(stored),
        ]);
      } catch (e) {
        if ((e as { code?: string }).code === "23505") throw Object.assign(new Error("Document existant."), { code: "EEXIST" });
        throw e;
      }
      return stored;
    },

    async get<T extends Doc>(collection: Collection, id: string) {
      await init();
      if (!isValidId(collection, id)) return null;
      const r = await sql.query("SELECT data, rev FROM documents WHERE collection = $1 AND id = $2", [collection, id]);
      return r.rows[0] ? withRev<T>(r.rows[0].data, Number(r.rows[0].rev)) : null;
    },

    async replace<T extends Doc>(collection: Collection, doc: T) {
      await init();
      if (!isValidId(collection, doc.id)) throw new Error("Identifiant invalide.");
      const expected = doc.rev ?? 1;
      const next = { ...doc, rev: expected + 1 };
      const r = await sql.query(
        "UPDATE documents SET data = $3::jsonb, rev = rev + 1, updated_at = now() WHERE collection = $1 AND id = $2 AND rev = $4 RETURNING rev",
        [collection, doc.id, JSON.stringify(next), expected],
      );
      if (r.rowCount === 1) return next;
      // Aucune ligne modifiée : le document n'existe pas, ou sa révision a changé.
      const exists = await sql.query("SELECT 1 FROM documents WHERE collection = $1 AND id = $2", [collection, doc.id]);
      if (exists.rowCount === 1) throw new ConflictError();
      if (collection !== "settings") throw new NotFoundError();
      // Réglages : créés au premier enregistrement (concurrence tranchée par la clé primaire).
      const created = { ...doc, rev: 1 };
      try {
        await sql.query("INSERT INTO documents (collection, id, rev, data) VALUES ($1, $2, 1, $3::jsonb)", [collection, doc.id, JSON.stringify(created)]);
      } catch (e) {
        if ((e as { code?: string }).code === "23505") throw new ConflictError();
        throw e;
      }
      return created;
    },

    async list<T extends Doc>(collection: Collection) {
      await init();
      const r = await sql.query("SELECT data, rev FROM documents WHERE collection = $1 ORDER BY created_at DESC, id DESC", [collection]);
      return r.rows.map((row) => withRev<T>(row.data, Number(row.rev)));
    },

    async nextSequence(name: string, year: number) {
      await init();
      if (!/^[a-z-]{3,20}$/.test(name)) throw new Error("Nom de compteur invalide.");
      // Une seule instruction atomique : pas de trou ni de doublon, même avec des appels simultanés.
      const r = await sql.query(
        "INSERT INTO counters (name, year, value) VALUES ($1, $2, 1) ON CONFLICT (name, year) DO UPDATE SET value = counters.value + 1 RETURNING value",
        [name, year],
      );
      return Number(r.rows[0].value);
    },
  };
}

let pool: Pool | null = null;
export function poolFromEnv(): Sql {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 4, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
  return pool as unknown as Sql;
}
