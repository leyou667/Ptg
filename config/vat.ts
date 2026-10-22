import type { VatRate } from "@/lib/billing/types";

/**
 * RÈGLES DE TVA. Volontairement vide : le taux applicable à chaque prestation (et les cas d'exonération ou
 * d'autoliquidation) relève d'une décision comptable à prendre avec votre comptable, pas de ce code.
 *
 * Exemple d'entrée : { id: "standard", label: "TVA standard", ratePercent: 21 }
 */
export const vatRates: VatRate[] = [];
