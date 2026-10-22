import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileBackend } from "@/lib/storage/file";
import { createPostgresBackend } from "@/lib/storage/postgres";
import { isValidId, newId } from "@/lib/storage/ids";
import { ConflictError, NotFoundError, type Backend } from "@/lib/storage/types";
import * as storage from "@/lib/storage";

/** Le stockage PostgreSQL est testé contre un vrai serveur quand TEST_DATABASE_URL est défini ; sinon ces tests sont ignorés. */
const PG_URL = process.env.TEST_DATABASE_URL;
let dir: string;
let pool: Pool | null = null;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "cheyclean-store-"));
  process.env.DATA_DIR = dir;
  if (PG_URL) pool = new Pool({ connectionString: PG_URL, max: 8 });
});
afterAll(async () => {
  delete process.env.DATA_DIR;
  await pool?.end();
  await rm(dir, { recursive: true, force: true });
});

const backends: [string, () => Promise<Backend>][] = [
  [
    "fichiers",
    async () => {
      await rm(dir, { recursive: true, force: true }); // chaque test repart d'un dossier vide
      return fileBackend;
    },
  ],
];
if (PG_URL) {
  backends.push([
    "PostgreSQL (vrai serveur)",
    async () => {
      const b = createPostgresBackend(pool as never);
      await b.ready();
      await pool!.query("TRUNCATE documents, counters");
      return b;
    },
  ]);
}

describe.each(backends)("stockage %s", (_name, make) => {
  it("crée, relit, refuse les doublons et ne mélange pas les collections", async () => {
    const b = await make();
    const id = newId("DEV");
    const doc = { id, createdAt: "2026-01-01T10:00:00.000Z", name: "Léa", nested: { a: [1, 2, { b: "Œuvre" }] } };
    const created = await b.create("requests", doc);
    expect(created.rev).toBe(1);
    expect(await b.get("requests", id)).toEqual({ ...doc, rev: 1 });
    await expect(b.create("requests", doc)).rejects.toMatchObject({ code: "EEXIST" });
    expect(await b.get("quotes", id.replace("DEV", "QUO"))).toBeNull();
    expect(await b.get("requests", "../../etc/passwd")).toBeNull();
  });

  it("refuse une modification faite sur une version périmée (révisions)", async () => {
    const b = await make();
    const id = newId("DEV");
    const v1 = await b.create("requests", { id, createdAt: "2026-01-01T10:00:00.000Z", n: 1 });
    const v2 = await b.replace("requests", { ...v1, n: 2 });
    expect(v2.rev).toBe(2);
    await expect(b.replace("requests", { ...v1, n: 99 })).rejects.toBeInstanceOf(ConflictError); // v1 est périmée
    const v3 = await b.replace("requests", { ...v2, n: 3 });
    expect((await b.get<{ id: string; n: number }>("requests", id))?.n).toBe(3);
    expect(v3.rev).toBe(3);
    await expect(b.replace("requests", { id: newId("DEV"), n: 1 })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deux écritures simultanées : une seule gagne, l'autre est refusée proprement", async () => {
    const b = await make();
    const id = newId("DEV");
    const v1 = await b.create("requests", { id, createdAt: "2026-01-01T10:00:00.000Z", n: 0 });
    const results = await Promise.allSettled([b.replace("requests", { ...v1, n: 1 }), b.replace("requests", { ...v1, n: 2 })]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });

  it("liste du plus récent au plus ancien et sépare les collections", async () => {
    const b = await make();
    const old = newId("DEV");
    const recent = newId("DEV");
    await b.create("requests", { id: old, createdAt: "2026-01-01T10:00:00.000Z" });
    await b.create("requests", { id: recent, createdAt: "2026-03-01T10:00:00.000Z" });
    await b.create("quotes", { id: newId("QUO"), createdAt: "2026-02-01T10:00:00.000Z" });
    expect((await b.list("requests")).map((d) => d.id)).toEqual([recent, old]);
    expect(await b.list("quotes")).toHaveLength(1);
    expect(await b.list("invoices")).toEqual([]);
  });

  it("réglages : créés au premier enregistrement, ensuite versionnés", async () => {
    const b = await make();
    expect(await b.get("settings", "vat")).toBeNull();
    const first = await b.replace("settings", { id: "vat", rates: [] });
    expect(first.rev).toBe(1);
    const second = await b.replace("settings", { ...first, rates: [{ id: "x" }] });
    expect(second.rev).toBe(2);
    await expect(b.replace("settings", { ...first, rates: [] })).rejects.toBeInstanceOf(ConflictError);
  });

  it("compteur séquentiel sans trou ni doublon, même avec 25 appels simultanés", async () => {
    const b = await make();
    const nums = await Promise.all(Array.from({ length: 25 }, () => b.nextSequence("invoice", 2026)));
    expect([...nums].sort((x, y) => x - y)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
    expect(await b.nextSequence("invoice", 2027)).toBe(1); // un compteur par année
    expect(await b.nextSequence("quote", 2026)).toBe(1); // et par nom
  });

  it("conserve exactement le contenu JSON (accents, caractères spéciaux, imbrication)", async () => {
    const b = await make();
    const id = newId("DEV");
    const doc = { id, createdAt: "2026-01-01T10:00:00.000Z", text: "Œuvre « test » – 80 m² \"guillemets\" \\ \n ligne", list: [null, true, 1.5] };
    await b.create("requests", doc);
    expect(await b.get("requests", id)).toEqual({ ...doc, rev: 1 });
  });
});

describe("identifiants", () => {
  it("acceptent le format attendu et refusent le reste", () => {
    expect(isValidId("requests", newId("DEV"))).toBe(true);
    expect(isValidId("quotes", newId("DEV"))).toBe(false);
    expect(isValidId("settings", "catalog")).toBe(true);
    expect(isValidId("settings", "../x")).toBe(false);
    expect(isValidId("requests", "DEV-2610-ABC'; DROP TABLE documents;--")).toBe(false);
  });
});

describe("choix du stockage", () => {
  it("utilise les fichiers sans DATABASE_URL et PostgreSQL avec", async () => {
    expect(storage.storageKind()).toBe("file");
    if (!PG_URL) return;
    process.env.DATABASE_URL = PG_URL;
    try {
      expect(storage.storageKind()).toBe("postgres");
      await pool!.query("TRUNCATE documents, counters").catch(() => {});
      const id = newId("DEV");
      await storage.create("requests", { id, createdAt: "2026-01-01T00:00:00.000Z" });
      expect((await storage.get("requests", id))?.id).toBe(id);
      const row = await pool!.query("SELECT collection, rev FROM documents WHERE id = $1", [id]);
      expect(row.rows[0]).toEqual({ collection: "requests", rev: 1 });
    } finally {
      delete process.env.DATABASE_URL;
    }
  });
});
