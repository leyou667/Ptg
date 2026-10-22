import type { RequestStatus } from "@/lib/requests/status";
import type { QuoteStatus } from "@/lib/billing/types";

export const requestStatusLabel: Record<RequestStatus, string> = {
  new: "Nouvelle",
  in_progress: "En cours",
  quoted: "Devis envoyé",
  archived: "Archivée",
};

/** Libellés des onglets de filtre (pluriel). */
export const requestStatusTab: Record<RequestStatus, string> = {
  new: "Nouvelles",
  in_progress: "En cours",
  quoted: "Devis envoyés",
  archived: "Archivées",
};

export const requestStatusHelp: Record<RequestStatus, string> = {
  new: "Pas encore ouverte ni traitée.",
  in_progress: "Prise en charge, devis en préparation.",
  quoted: "Un devis a été émis pour cette demande.",
  archived: "Classée, sans suite ou terminée.",
};

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Émis",
  accepted: "Accepté",
  declined: "Refusé",
  expired: "Expiré",
};

export const profileLabel = { particulier: "Particulier", societe: "Société" } as const;
