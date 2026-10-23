import { formulas, quote, type FormulaId, type Profile } from "@/content/fr";

export type PricingPlan = {
  id: FormulaId;
  name: string;
  tagline: string;
  frequency: string;
  included: string[];
  options: string[];
  isRecommended: boolean;
  buttonLabel: string;
  href: string;
};

const split = (value: string | undefined) => (value ? value.split(", ").map((x) => x.trim()).filter(Boolean) : []);

/**
 * Les formules viennent de content/fr.ts, l'unique source des textes : rien n'est recopié ici.
 * Les lignes « Inclus » et « Options » sont séparées à chaque virgule ; le texte reste identique.
 */
export function buildPlans(profile: Profile): PricingPlan[] {
  const page = profile === "societe" ? "societe" : "particulier";
  return formulas[profile].map((f) => {
    const row = (label: string) => f.rows.find((r) => r.label === label)?.value;
    return {
      id: f.id,
      name: f.name,
      tagline: f.tagline,
      frequency: row("Fréquence") ?? "",
      included: split(row("Inclus")),
      options: split(row("Options")),
      isRecommended: !!f.recommended,
      buttonLabel: quote.formulas.choose,
      href: `/devis/${page}?formule=${f.id}`,
    };
  });
}
