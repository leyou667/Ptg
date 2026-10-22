/**
 * Identité du vendeur, nécessaire pour émettre un devis ou une facture. Rien n'est inventé : tant que ces variables
 * ne sont pas renseignées, l'émission d'une facture définitive reste bloquée (voir lib/billing/workflow.ts).
 */
export type Seller = {
  legalName: string;
  legalForm: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  vatNumber: string;
  iban: string;
  email: string;
  phone: string;
};

export function sellerFromEnv(env: Record<string, string | undefined> = process.env): Seller {
  return {
    legalName: env.COMPANY_NAME ?? "",
    legalForm: env.COMPANY_FORM ?? "",
    street: env.COMPANY_STREET ?? "",
    postalCode: env.COMPANY_POSTAL_CODE ?? "",
    city: env.COMPANY_CITY ?? "",
    country: env.COMPANY_COUNTRY ?? "Belgique",
    vatNumber: env.COMPANY_VAT ?? "",
    iban: env.COMPANY_IBAN ?? "",
    email: env.COMPANY_EMAIL ?? "",
    phone: env.COMPANY_PHONE ?? "",
  };
}
