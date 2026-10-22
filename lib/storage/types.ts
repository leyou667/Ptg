/**
 * Interface commune des deux stockages (fichiers JSON ou PostgreSQL). Un document est un objet JSON avec un `id`
 * et, une fois enregistré, une révision `rev` : elle sert à refuser une modification faite sur une version périmée
 * (deux onglets, deux administrateurs) au lieu d'écraser silencieusement l'autre.
 */
export type Collection = "requests" | "quotes" | "invoices" | "settings";

export type Doc = { id: string; rev?: number; createdAt?: string };

export class StorageUnavailableError extends Error {
  constructor(message = "Aucun stockage durable n'est configuré.") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Ce document a été modifié entre-temps. Rechargez la page.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Document introuvable.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export interface Backend {
  readonly kind: "file" | "postgres";
  /** Crée un document (rev = 1). Échoue avec { code: "EEXIST" } s'il existe déjà. */
  create<T extends Doc>(collection: Collection, doc: T): Promise<T & { rev: number }>;
  get<T extends Doc>(collection: Collection, id: string): Promise<T | null>;
  /** Remplace un document existant. `doc.rev` doit être la révision lue : sinon ConflictError. Renvoie le document avec sa nouvelle révision. */
  replace<T extends Doc>(collection: Collection, doc: T): Promise<T & { rev: number }>;
  /** Tous les documents d'une collection, du plus récent au plus ancien. */
  list<T extends Doc>(collection: Collection): Promise<T[]>;
  /** Compteur séquentiel sans trou : 1, 2, 3… par nom et par année. */
  nextSequence(name: string, year: number): Promise<number>;
}
