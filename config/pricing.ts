import type { CatalogItem } from "@/lib/billing/types";

/**
 * CATALOGUE DES PRESTATIONS ET PRIX. Volontairement vide : aucun prix n'est défini à ce jour.
 *
 * Pour ajouter une prestation, ajoutez une entrée à ce tableau avec : id, label, unit (heure, m², forfait…),
 * unitPriceCents (prix unitaire HORS TVA, en centimes d'euro) et vatRateId (un identifiant de config/vat.ts).
 * Aucune autre partie de l'application n'est à modifier.
 */
export const catalog: CatalogItem[] = [];
