import type { Cents, QuoteLine, StrictLine, Totals, VatRate } from "./types";

export class PricingNotConfiguredError extends Error {
  constructor(message = "Aucun prix n'est configuré : impossible de calculer des montants.") {
    super(message);
    this.name = "PricingNotConfiguredError";
  }
}

const isCents = (n: unknown): n is Cents => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;

/** Problèmes empêchant de chiffrer ces lignes ; liste vide = elles sont complètes et cohérentes. */
export function lineProblems(lines: QuoteLine[], vatRates: VatRate[]): string[] {
  const out: string[] = [];
  if (lines.length === 0) out.push("Le devis ne contient aucune ligne.");
  lines.forEach((l, i) => {
    const n = `Ligne ${i + 1}${l.label ? ` (« ${l.label} »)` : ""}`;
    if (!l.label.trim()) out.push(`Ligne ${i + 1} : désignation manquante.`);
    if (!(l.quantity > 0) || !Number.isFinite(l.quantity)) out.push(`${n} : quantité invalide.`);
    if (!isCents(l.unitPriceCents)) out.push(`${n} : prix unitaire manquant.`);
    if (!l.vatRateId) out.push(`${n} : taux de TVA manquant.`);
    else if (!vatRates.some((r) => r.id === l.vatRateId)) out.push(`${n} : taux de TVA inconnu.`);
  });
  return out;
}

/**
 * Calcul en centimes entiers. La TVA est calculée par taux sur la somme des bases (pas ligne par ligne) et arrondie
 * au centime le plus proche, pour que le total TVA égale la somme de la TVA par taux, comme sur une facture.
 */
export function computeTotals(lines: QuoteLine[], vatRates: VatRate[]): Totals {
  if (vatRates.length === 0) throw new PricingNotConfiguredError("Aucune règle de TVA n'est configurée.");
  const problems = lineProblems(lines, vatRates);
  if (problems.length) throw new PricingNotConfiguredError(problems[0]);
  const strict = lines as StrictLine[];

  const perLine = strict.map((l) => ({ vatRateId: l.vatRateId, netCents: Math.round(l.unitPriceCents * l.quantity) }));
  const byRate = new Map<string, Cents>();
  for (const l of perLine) byRate.set(l.vatRateId, (byRate.get(l.vatRateId) ?? 0) + l.netCents);

  const vatByRate = [...byRate].map(([vatRateId, baseCents]) => {
    const ratePercent = vatRates.find((r) => r.id === vatRateId)!.ratePercent;
    return { vatRateId, ratePercent, baseCents, vatCents: Math.round((baseCents * ratePercent) / 100) };
  });
  const netCents = vatByRate.reduce((s, r) => s + r.baseCents, 0);
  const vatCents = vatByRate.reduce((s, r) => s + r.vatCents, 0);

  return {
    lines: perLine.map((l) => {
      const rate = vatRates.find((r) => r.id === l.vatRateId)!.ratePercent;
      const vat = Math.round((l.netCents * rate) / 100);
      return { netCents: l.netCents, vatCents: vat, grossCents: l.netCents + vat };
    }),
    vatByRate,
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
  };
}
