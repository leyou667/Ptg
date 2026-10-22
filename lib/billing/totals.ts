import type { Cents, QuoteLine, Totals, VatRate } from "./types";

export class PricingNotConfiguredError extends Error {
  constructor(message = "Aucun prix n'est configuré : impossible de calculer des montants.") {
    super(message);
    this.name = "PricingNotConfiguredError";
  }
}

const isCents = (n: number): n is Cents => Number.isSafeInteger(n) && n >= 0;

/**
 * Calcul en centimes entiers. La TVA est calculée par taux sur la somme des bases (pas ligne par ligne) et arrondie
 * au centime le plus proche, pour que le total TVA égale la somme de la TVA par taux, comme sur une facture.
 */
export function computeTotals(lines: QuoteLine[], vatRates: VatRate[]): Totals {
  if (lines.length === 0) throw new PricingNotConfiguredError("Le devis ne contient aucune ligne.");
  if (vatRates.length === 0) throw new PricingNotConfiguredError("Aucune règle de TVA n'est configurée.");

  const perLine = lines.map((l) => {
    if (!isCents(l.unitPriceCents)) throw new PricingNotConfiguredError(`Prix unitaire invalide pour « ${l.label} ».`);
    if (!(l.quantity > 0) || !Number.isFinite(l.quantity)) throw new PricingNotConfiguredError(`Quantité invalide pour « ${l.label} ».`);
    if (!vatRates.some((r) => r.id === l.vatRateId)) throw new PricingNotConfiguredError(`Taux de TVA inconnu « ${l.vatRateId} ».`);
    return { itemId: l.itemId, vatRateId: l.vatRateId, netCents: Math.round(l.unitPriceCents * l.quantity) };
  });

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
      return { itemId: l.itemId, netCents: l.netCents, vatCents: vat, grossCents: l.netCents + vat };
    }),
    vatByRate,
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
  };
}
