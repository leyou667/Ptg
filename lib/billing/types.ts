/**
 * Trois objets distincts, qui ne se mélangent jamais :
 *  1. la DEMANDE DE DEVIS (lib/requests) : ce que le client déclare, sans prix ;
 *  2. le DEVIS (Quote) : une offre chiffrée par CheyClean, qui peut être envoyée, acceptée ou refusée ;
 *  3. la FACTURE DÉFINITIVE (Invoice) : émise seulement à partir d'un devis accepté, numérotation continue.
 * Les montants sont des entiers en centimes d'euro, jamais des flottants.
 */
export type Cents = number;

export type VatRate = { id: string; label: string; ratePercent: number };

export type CatalogItem = { id: string; label: string; unit: string; unitPriceCents: Cents; vatRateId: string };

export type QuoteLine = { itemId: string; label: string; unit: string; quantity: number; unitPriceCents: Cents; vatRateId: string };

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type Totals = {
  lines: { itemId: string; netCents: Cents; vatCents: Cents; grossCents: Cents }[];
  vatByRate: { vatRateId: string; ratePercent: number; baseCents: Cents; vatCents: Cents }[];
  netCents: Cents;
  vatCents: Cents;
  grossCents: Cents;
};

export type Quote = {
  id: string;
  kind: "quote";
  /** La demande de devis dont il est issu. */
  requestId: string;
  status: QuoteStatus;
  lines: QuoteLine[];
  createdAt: string;
  sentAt?: string;
  validUntil?: string;
  acceptedAt?: string;
  declinedAt?: string;
  /** Renseigné à l'émission de la facture : un devis accepté ne donne lieu qu'à une seule facture. */
  invoiceId?: string;
};

export type BillingParty = {
  name: string;
  vatNumber?: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

export type Invoice = {
  id: string;
  kind: "invoice";
  /** Numéro légal, séquentiel et sans trou, par exemple 2026-0001. */
  number: string;
  quoteId: string;
  requestId: string;
  issuedAt: string;
  seller: import("@/config/company").Seller;
  buyer: BillingParty;
  lines: QuoteLine[];
  totals: Totals;
};
