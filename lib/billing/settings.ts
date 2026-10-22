import { z } from "zod";
import { catalog as defaultCatalog } from "@/config/pricing";
import { vatRates as defaultVat } from "@/config/vat";
import { sellerFromEnv, type Seller } from "@/config/company";
import { checkVatNumber } from "@/lib/be-vat";
import { normalizeIban } from "@/lib/iban";
import { get, replace } from "@/lib/storage";
import type { Doc } from "@/lib/storage/types";
import type { BillingDeps } from "./workflow";
import type { CatalogItem, VatRate } from "./types";

/**
 * Prestations, prix, TVA et identité du vendeur : saisis dans l'administration et conservés dans le stockage.
 * Tant que rien n'est enregistré, on retombe sur config/ et sur les variables COMPANY_* (vides par défaut).
 */
export type CatalogSettings = Doc & { id: "catalog"; items: CatalogItem[] };
export type VatSettings = Doc & { id: "vat"; rates: VatRate[] };
export type CompanySettings = Doc & { id: "company"; seller: Seller; quoteTerms: string; defaultValidDays: number };

const txt = (max: number) => z.string().trim().max(max, "Texte trop long.");
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,39}$/, "Identifiant invalide.");

export const catalogSchema = z.object({
  items: z
    .array(
      z.object({
        id: slug,
        label: txt(120).min(1, "Indiquez la désignation de la prestation."),
        unit: txt(20).min(1, "Indiquez l'unité (heure, m², forfait…)."),
        unitPriceCents: z.number({ error: "Indiquez un prix." }).int("Prix invalide.").min(0, "Le prix ne peut pas être négatif.").max(100_000_000, "Prix trop élevé."),
        vatRateId: slug,
        description: txt(300).optional(),
      }),
    )
    .max(200, "Trop de prestations."),
});

export const vatSchema = z.object({
  rates: z
    .array(
      z.object({
        id: slug,
        label: txt(80).min(1, "Indiquez le libellé du taux."),
        ratePercent: z.number({ error: "Indiquez un pourcentage." }).min(0, "Un taux ne peut pas être négatif.").max(100, "Un taux ne dépasse pas 100 %."),
      }),
    )
    .max(20),
});

export const companySchema = z.object({
  seller: z.object({
    legalName: txt(120).min(1, "Indiquez le nom légal."),
    legalForm: txt(40),
    street: txt(120).min(1, "Indiquez la rue et le numéro."),
    postalCode: txt(12).min(1, "Indiquez le code postal."),
    city: txt(80).min(1, "Indiquez la ville."),
    country: txt(60).min(1, "Indiquez le pays."),
    vatNumber: txt(30)
      .min(1, "Indiquez le numéro d'entreprise ou de TVA.")
      .transform((v, ctx) => {
        const r = checkVatNumber(v);
        if (!r.ok) {
          ctx.addIssue({ code: "custom", message: "Ce numéro n'est pas valide. Vérifiez les chiffres, par exemple BE 0123.456.789." });
          return z.NEVER;
        }
        return r.normalized;
      }),
    iban: txt(40).transform((v, ctx) => {
      if (!v) return "";
      const n = normalizeIban(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Cet IBAN n'est pas valide." });
        return z.NEVER;
      }
      return n;
    }),
    email: txt(160).refine((v) => !v || z.email().safeParse(v).success, "Adresse email invalide."),
    phone: txt(30),
  }),
  quoteTerms: txt(2000),
  defaultValidDays: z.number().int("Nombre entier de jours.").min(1, "Au moins 1 jour.").max(365, "Au plus 365 jours."),
});

export async function loadCatalog() {
  return (await get<CatalogSettings>("settings", "catalog")) ?? null;
}
export async function loadVat() {
  return (await get<VatSettings>("settings", "vat")) ?? null;
}
export async function loadCompany() {
  return (await get<CompanySettings>("settings", "company")) ?? null;
}

export type FullBillingDeps = BillingDeps & { quoteTerms: string; defaultValidDays: number };

export async function loadBillingDeps(): Promise<FullBillingDeps> {
  const [c, v, co] = await Promise.all([loadCatalog(), loadVat(), loadCompany()]);
  return {
    catalog: c?.items ?? defaultCatalog,
    vatRates: v?.rates ?? defaultVat,
    seller: co?.seller ?? sellerFromEnv(),
    quoteTerms: co?.quoteTerms ?? "",
    defaultValidDays: co?.defaultValidDays ?? 30,
  };
}

export const saveCatalog = (items: CatalogItem[], rev?: number) => replace<CatalogSettings>("settings", { id: "catalog", items, rev });
export const saveVat = (rates: VatRate[], rev?: number) => replace<VatSettings>("settings", { id: "vat", rates, rev });
export const saveCompany = (v: { seller: Seller; quoteTerms: string; defaultValidDays: number }, rev?: number) =>
  replace<CompanySettings>("settings", { id: "company", ...v, rev });
