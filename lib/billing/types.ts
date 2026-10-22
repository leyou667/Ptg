import type { Seller } from "@/config/company";
import type { Doc } from "@/lib/storage/types";

/**
 * Trois objets distincts, qui ne se mélangent jamais :
 *  1. la DEMANDE DE DEVIS (lib/requests) : ce que le client déclare, sans prix ;
 *  2. le DEVIS (Quote) : une offre chiffrée par CheyClean, brouillon puis émise, acceptée ou refusée ;
 *  3. la FACTURE DÉFINITIVE (Invoice) : émise seulement à partir d'un devis accepté, numérotation continue.
 * Les montants sont des entiers en centimes d'euro, jamais des flottants.
 */
export type Cents = number;

export type VatRate = { id: string; label: string; ratePercent: number };

export type CatalogItem = { id: string; label: string; unit: string; unitPriceCents: Cents; vatRateId: string; description?: string };

/** Une ligne de devis. Dans un brouillon, le prix et le taux peuvent encore être vides ; un devis émis n'a que des lignes complètes. */
export type QuoteLine = {
  itemId?: string;
  label: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPriceCents: Cents | null;
  vatRateId: string | null;
};

export type StrictLine = QuoteLine & { unitPriceCents: Cents; vatRateId: string };

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type Totals = {
  lines: { netCents: Cents; vatCents: Cents; grossCents: Cents }[];
  vatByRate: { vatRateId: string; ratePercent: number; baseCents: Cents; vatCents: Cents }[];
  netCents: Cents;
  vatCents: Cents;
  grossCents: Cents;
};

export type BillingParty = {
  name: string;
  vatNumber?: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  contact?: string;
};

export type Quote = Doc & {
  kind: "quote";
  /** La demande de devis dont il est issu. */
  requestId: string;
  status: QuoteStatus;
  subject: string;
  notes: string;
  validDays: number;
  lines: QuoteLine[];
  createdAt: string;
  updatedAt: string;
  /** Renseignés à l'émission : le devis est alors figé. */
  number?: string;
  sentAt?: string;
  validUntil?: string;
  seller?: Seller;
  buyer?: BillingParty;
  vatRates?: VatRate[];
  totals?: Totals;
  quoteTerms?: string;
  acceptedAt?: string;
  declinedAt?: string;
  expiredAt?: string;
  /** Renseigné à l'émission de la facture : un devis accepté ne donne lieu qu'à une seule facture. */
  invoiceId?: string;
  /** Devis dont celui-ci est une nouvelle version. */
  replaces?: string;
};

export type Invoice = Doc & {
  kind: "invoice";
  /** Numéro légal, séquentiel et sans trou, par exemple 2026-0001. */
  number: string;
  quoteId: string;
  requestId: string;
  issuedAt: string;
  seller: Seller;
  buyer: BillingParty;
  lines: StrictLine[];
  totals: Totals;
};
