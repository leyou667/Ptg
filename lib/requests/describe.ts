import { formulas } from "@/content/fr";
import { flow, labels, natures } from "@/content/questionnaire";
import type { RequestFields } from "./schema";

export type Group = { title: string; rows: [label: string, value: string][] };

/** Une seule description, utilisée par le récapitulatif à l'écran, le PDF et l'email : elles ne peuvent pas diverger. */
export function describeRequest(d: RequestFields): Group[] {
  const nature = natures[d.profile].find((n) => n.id === d.nature)?.label ?? d.nature;
  const formula = d.formula === "undecided" ? flow.undecided : (formulas[d.profile].find((f) => f.id === d.formula)?.name ?? d.formula);
  const place =
    d.profile === "particulier"
      ? `${d.street}, ${d.postalCode} ${d.city}`
      : d.siteSameAsBilling
        ? "Identique à l'adresse de facturation"
        : `${d.siteStreet}, ${d.sitePostalCode} ${d.siteCity}`;
  const need: Group = {
    title: flow.groups.need,
    rows: [
      ["Adresse du lieu", place],
      [labels.nature, nature],
      [labels.placeType, d.placeType],
      [labels.surface, `${d.surface} m²`],
      [labels.frequency, d.frequency],
      [labels.description, d.description],
      ...(d.profile === "societe" && d.preferredSchedule ? ([[labels.preferredSchedule, d.preferredSchedule]] as [string, string][]) : []),
    ],
  };
  const formulaGroup: Group = { title: flow.groups.formula, rows: [["Formule", formula]] };

  if (d.profile === "particulier") {
    return [
      {
        title: flow.groups.contact,
        rows: [
          [labels.firstName, d.firstName],
          [labels.lastName, d.lastName],
          [labels.email, d.email],
          [labels.phone, d.phone],
        ],
      },
      need,
      formulaGroup,
    ];
  }
  return [
    {
      title: flow.groups.company,
      rows: [
        [labels.companyName, d.companyName],
        [labels.vatNumber, d.vatNumber],
        ["Adresse de facturation", `${d.billingStreet}, ${d.billingPostalCode} ${d.billingCity}, ${d.billingCountry}`],
      ],
    },
    {
      title: flow.groups.contact,
      rows: [
        ["Personne de contact", `${d.contactFirstName} ${d.contactLastName}${d.contactRole ? `, ${d.contactRole}` : ""}`],
        [labels.email, d.email],
        [labels.phone, d.phone],
      ],
    },
    need,
    formulaGroup,
  ];
}
