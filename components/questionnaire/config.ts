import { frequencies, placeTypes, type Profile } from "@/content/fr";
import { flow, labels, natures } from "@/content/questionnaire";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "select" | "textarea" | "checkbox";
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  help?: string;
  options?: { value: string; label: string }[];
  /** 1 = demi-largeur sur ordinateur, 2 = pleine largeur. */
  span?: 1 | 2;
  showIf?: (values: Values) => boolean;
  maxLength?: number;
};

export type Values = Record<string, string | boolean>;

export type StepDef = { id: string; title: string; kind: "fields" | "formula" | "recap"; fields: FieldDef[] };

const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

const place = (prefix: "" | "site"): FieldDef[] => {
  const k = (n: string) => (prefix ? `${prefix}${n[0].toUpperCase()}${n.slice(1)}` : n);
  return [
    { name: k("street"), label: prefix ? labels.siteStreet : "Adresse du lieu (rue et numéro)", type: "text", autoComplete: prefix ? "off" : "street-address", span: 2, maxLength: 120 },
    { name: k("postalCode"), label: prefix ? labels.sitePostalCode : labels.postalCode, type: "text", inputMode: "numeric", autoComplete: prefix ? "off" : "postal-code", maxLength: 4 },
    { name: k("city"), label: prefix ? labels.siteCity : labels.city, type: "text", autoComplete: prefix ? "off" : "address-level2", maxLength: 80 },
  ];
};

const need = (profile: Profile): FieldDef[] => [
  { name: "nature", label: labels.nature, type: "select", options: natures[profile].map((n) => ({ value: n.id, label: n.label })), span: 2 },
  { name: "placeType", label: labels.placeType, type: "select", options: opts(placeTypes[profile]) },
  { name: "surface", label: labels.surface, type: "number", inputMode: "numeric", help: labels.surfaceHelp },
  { name: "frequency", label: labels.frequency, type: "select", options: opts(frequencies), span: 2 },
  { name: "description", label: labels.description, type: "textarea", help: labels.descriptionHelp, span: 2, maxLength: 1500 },
];

export function stepsFor(profile: Profile): StepDef[] {
  if (profile === "particulier") {
    return [
      {
        id: "you",
        title: flow.steps.you,
        kind: "fields",
        fields: [
          { name: "firstName", label: labels.firstName, type: "text", autoComplete: "given-name", maxLength: 60 },
          { name: "lastName", label: labels.lastName, type: "text", autoComplete: "family-name", maxLength: 60 },
          { name: "email", label: labels.email, type: "email", autoComplete: "email", inputMode: "email", maxLength: 160 },
          { name: "phone", label: labels.phone, type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 30 },
        ],
      },
      { id: "need", title: flow.steps.need, kind: "fields", fields: [...place(""), ...need("particulier")] },
      { id: "formula", title: flow.steps.formula, kind: "formula", fields: [] },
      { id: "recap", title: flow.steps.recap, kind: "recap", fields: [] },
    ];
  }
  return [
    {
      id: "company",
      title: flow.steps.company,
      kind: "fields",
      fields: [
        { name: "companyName", label: labels.companyName, type: "text", autoComplete: "organization", span: 2, maxLength: 120 },
        { name: "vatNumber", label: labels.vatNumber, type: "text", help: labels.vatHelp, span: 2, maxLength: 24 },
        { name: "billingStreet", label: labels.billingStreet, type: "text", autoComplete: "street-address", span: 2, maxLength: 120 },
        { name: "billingPostalCode", label: labels.billingPostalCode, type: "text", inputMode: "numeric", autoComplete: "postal-code", maxLength: 4 },
        { name: "billingCity", label: labels.billingCity, type: "text", autoComplete: "address-level2", maxLength: 80 },
        { name: "billingCountry", label: labels.billingCountry, type: "text", autoComplete: "country-name", maxLength: 60 },
      ],
    },
    {
      id: "contact",
      title: flow.steps.contact,
      kind: "fields",
      fields: [
        { name: "contactFirstName", label: labels.contactFirstName, type: "text", autoComplete: "given-name", maxLength: 60 },
        { name: "contactLastName", label: labels.contactLastName, type: "text", autoComplete: "family-name", maxLength: 60 },
        { name: "contactRole", label: labels.contactRole, type: "text", autoComplete: "organization-title", maxLength: 80 },
        { name: "email", label: labels.email, type: "email", autoComplete: "email", inputMode: "email", maxLength: 160 },
        { name: "phone", label: labels.phone, type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 30 },
      ],
    },
    {
      id: "need",
      title: flow.steps.need,
      kind: "fields",
      fields: [
        { name: "siteSameAsBilling", label: labels.siteSameAsBilling, type: "checkbox", span: 2 },
        ...place("site").map((f) => ({ ...f, showIf: (v: Values) => v.siteSameAsBilling === false })),
        ...need("societe"),
        { name: "preferredSchedule", label: labels.preferredSchedule, type: "text", span: 2, maxLength: 300 },
      ],
    },
    { id: "formula", title: flow.steps.formula, kind: "formula", fields: [] },
    { id: "recap", title: flow.steps.recap, kind: "recap", fields: [] },
  ];
}

export function initialValues(profile: Profile, formula?: string, prefill?: { placeType?: string; surface?: string; frequency?: string; nature?: string }): Values {
  const common: Values = { surface: prefill?.surface ?? "", frequency: prefill?.frequency ?? "", nature: prefill?.nature ?? "", placeType: prefill?.placeType ?? "", description: "", formula: formula ?? "undecided", consent: false, website: "" };
  if (profile === "particulier") return { ...common, firstName: "", lastName: "", email: "", phone: "", street: "", postalCode: "", city: "" };
  return {
    ...common,
    companyName: "", vatNumber: "", billingStreet: "", billingPostalCode: "", billingCity: "", billingCountry: "Belgique",
    contactFirstName: "", contactLastName: "", contactRole: "", email: "", phone: "",
    siteSameAsBilling: true, siteStreet: "", sitePostalCode: "", siteCity: "", preferredSchedule: "",
  };
}
