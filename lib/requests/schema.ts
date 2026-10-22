import { z } from "zod";
import { checkVatNumber } from "@/lib/be-vat";
import { formulas, frequencies, placeTypes } from "@/content/fr";
import { errors, natures } from "@/content/questionnaire";

const clean = (v: string) =>
  v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

const text = (champ: string, max: number, min = 1) =>
  z
    .string({ error: errors.required(champ) })
    .transform(clean)
    .pipe(z.string().min(min, errors.required(champ)).max(max, errors.tooLong));

const optionalText = (max: number) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().max(max, errors.tooLong))
    .optional()
    .default("");

const phone = z
  .string({ error: errors.phone })
  .transform(clean)
  .refine((v) => /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 9 && v.replace(/\D/g, "").length <= 15, errors.phone);

const email = z
  .string({ error: errors.email })
  .transform(clean)
  .pipe(z.string().max(160).pipe(z.email(errors.email)));

const postalCode = z
  .string({ error: errors.postalCode })
  .transform(clean)
  .refine((v) => /^[1-9]\d{3}$/.test(v), errors.postalCode);

const vat = z
  .string({ error: errors.vat })
  .transform(clean)
  .transform((v, ctx) => {
    const r = checkVatNumber(v);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: errors.vat });
      return z.NEVER;
    }
    return r.normalized;
  });

const surface = z
  .union([z.number(), z.string().transform((v) => Number(v.replace(",", ".")))])
  .pipe(z.number({ error: errors.surface }).int(errors.surface).min(5, errors.surface).max(100000, errors.surface));

const frequency = z.enum(frequencies as [string, ...string[]], { error: errors.choose("une fréquence") });

const formula = z
  .enum(["essentiel", "confort", "pro", "premium", "undecided"], { error: errors.choose("une formule") })
  .optional()
  .default("undecided");

const description = z
  .string({ error: errors.required("besoin") })
  .transform(clean)
  .pipe(z.string().min(1, errors.required("besoin")).max(1500, errors.tooLong))
  // Un texte non vide mais trop court reçoit son propre message, pas « Indiquez votre besoin ».
  .refine((v) => v.length === 0 || v.length >= 10, errors.description);

const base = {
  placeType: z.string({ error: errors.choose("un type de lieu") }).min(1, errors.choose("un type de lieu")),
  surface,
  frequency,
  description,
  formula,
  consent: z.literal(true, { error: errors.consent }),
  /** Champ piège anti-spam : un humain le laisse vide. */
  website: z.string().max(0).optional().default(""),
};

const address = (champ: string) => ({
  street: text(`${champ} (rue et numéro)`, 120),
  postalCode,
  city: text(`${champ} (ville)`, 80),
});

export const particulierSchema = z
  .object({
    profile: z.literal("particulier"),
    firstName: text("prénom", 60),
    lastName: text("nom", 60),
    email,
    phone,
    ...address("adresse"),
    nature: z.string({ error: errors.choose("la nature de la demande") }).min(1, errors.choose("la nature de la demande")),
    ...base,
  })
  .superRefine(refineChoices("particulier"));

export const societeSchema = z
  .object({
    profile: z.literal("societe"),
    companyName: text("nom de société", 120),
    vatNumber: vat,
    billingStreet: text("adresse de facturation (rue et numéro)", 120),
    billingPostalCode: postalCode,
    billingCity: text("ville de facturation", 80),
    billingCountry: text("pays", 60),
    contactFirstName: text("prénom du contact", 60),
    contactLastName: text("nom du contact", 60),
    contactRole: optionalText(80),
    email,
    phone,
    siteSameAsBilling: z.boolean(),
    siteStreet: optionalText(120),
    sitePostalCode: optionalText(8),
    siteCity: optionalText(80),
    nature: z.string({ error: errors.choose("la nature de la demande") }).min(1, errors.choose("la nature de la demande")),
    preferredSchedule: optionalText(300),
    ...base,
  })
  .superRefine((d, ctx) => {
    refineChoices("societe")(d, ctx);
    if (!d.siteSameAsBilling) {
      if (!d.siteStreet) ctx.addIssue({ code: "custom", path: ["siteStreet"], message: errors.required("adresse du lieu") });
      if (!/^[1-9]\d{3}$/.test(d.sitePostalCode)) ctx.addIssue({ code: "custom", path: ["sitePostalCode"], message: errors.postalCode });
      if (!d.siteCity) ctx.addIssue({ code: "custom", path: ["siteCity"], message: errors.required("ville du lieu") });
    }
  });

function refineChoices(profile: "particulier" | "societe") {
  return (d: { placeType: string; nature: string; formula: string }, ctx: z.RefinementCtx) => {
    if (!placeTypes[profile].includes(d.placeType)) ctx.addIssue({ code: "custom", path: ["placeType"], message: errors.choose("un type de lieu") });
    if (!natures[profile].some((n) => n.id === d.nature)) ctx.addIssue({ code: "custom", path: ["nature"], message: errors.choose("la nature de la demande") });
    if (d.formula !== "undecided" && !formulas[profile].some((f) => f.id === d.formula)) {
      ctx.addIssue({ code: "custom", path: ["formula"], message: errors.choose("une formule") });
    }
  };
}

export const requestSchema = z.discriminatedUnion("profile", [particulierSchema, societeSchema]);

export type ParticulierRequest = z.infer<typeof particulierSchema>;
export type SocieteRequest = z.infer<typeof societeSchema>;
export type RequestData = z.infer<typeof requestSchema>;
export type RequestInput = z.input<typeof requestSchema>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** Une demande sans les champs qui ne servent qu'à la saisie (consentement, champ piège). */
export type RequestFields = DistributiveOmit<RequestData, "consent" | "website">;
