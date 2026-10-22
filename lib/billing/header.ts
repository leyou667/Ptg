import { formulas } from "@/content/fr";
import { natures } from "@/content/questionnaire";
import type { StoredRequest } from "@/lib/requests/store";

/** Objet et première ligne proposés à partir des réponses du questionnaire. */
export function buildQuoteHeader(request: StoredRequest) {
  const d = request.data;
  const nature = natures[d.profile].find((n) => n.id === d.nature)?.label ?? d.nature;
  const city = d.profile === "particulier" ? d.city : d.siteSameAsBilling ? d.billingCity : d.siteCity;
  const formula = d.formula === "undecided" ? "" : (formulas[d.profile].find((f) => f.id === d.formula)?.name ?? "");
  return {
    subject: `${nature}, ${d.placeType}, ${d.surface} m², ${city}`,
    firstLine: {
      label: `${nature} : ${d.placeType} (${d.surface} m²)`,
      description: `Fréquence : ${d.frequency}${formula ? `. Formule envisagée : ${formula}` : ""}`,
    },
  };
}
