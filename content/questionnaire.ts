import type { FormulaId, Profile } from "./fr";

/** Nature de la demande : l'identifiant est stocké, le libellé est affiché. */
export const natures: Record<Profile, { id: string; label: string }[]> = {
  particulier: [
    { id: "entretien-regulier", label: "Entretien régulier à domicile" },
    { id: "grand-nettoyage", label: "Grand nettoyage ponctuel" },
    { id: "apres-travaux", label: "Nettoyage après travaux" },
    { id: "vitres", label: "Vitres" },
    { id: "autre", label: "Autre demande" },
  ],
  societe: [
    { id: "entretien-regulier", label: "Entretien régulier des locaux" },
    { id: "remise-en-etat", label: "Remise en état" },
    { id: "apres-travaux", label: "Nettoyage après travaux" },
    { id: "vitres", label: "Vitres" },
    { id: "autre", label: "Autre demande" },
  ],
};

export const choice = {
  title: "Pour qui est ce nettoyage ?",
  tagline: "CheyClean, l'éclat du propre, en abonnement.",
  sub: "Quatre étapes courtes, puis un devis sur mesure. Aucun prix n'est affiché : il est fixé après échange avec vous.",
  particulier: { word: "PARTICULIER", text: "Appartement, maison, villa", aria: "Faire une demande de devis en tant que particulier" },
  societe: { word: "SOCIÉTÉ", text: "Bureaux, commerces, écoles, salles de sport", aria: "Faire une demande de devis en tant que société" },
};

export const flow = {
  particulier: {
    h1: "Votre demande de devis",
    intro: "Quatre étapes courtes. Vos réponses sont gardées si vous revenez en arrière.",
  },
  societe: {
    h1: "Demande de devis pour votre société",
    intro: "Quatre étapes courtes. Vos réponses sont gardées si vous revenez en arrière.",
  },
  steps: {
    you: "Vous",
    company: "Société",
    contact: "Contact",
    need: "Lieu et besoin",
    formula: "Formule",
    recap: "Récapitulatif",
  },
  next: "Continuer",
  back: "Retour",
  edit: "Modifier",
  send: "Envoyer ma demande",
  sending: "Envoi en cours…",
  undecided: "Je ne sais pas encore",
  undecidedHelp: "Nous vous conseillerons une formule dans le devis.",
  formulaTitle: "Quelle formule vous intéresse ?",
  formulaHelp: "Ce choix est facultatif. Il n'engage à rien et se précise dans le devis.",
  recapTitle: "Vérifiez votre demande",
  recapHelp: "Rien n'est envoyé avant votre confirmation.",
  consent: "J'accepte que CheyClean utilise ces informations pour répondre à ma demande.",
  consentLink: "Politique de confidentialité",
  restored: "Vos réponses précédentes ont été retrouvées.",
  restoredClear: "Recommencer à zéro",
  sendError: "L'envoi a échoué. Vos réponses sont conservées : réessayez, ou écrivez-nous sur WhatsApp.",
  storageDown: "Le service d'enregistrement est indisponible pour le moment. Vos réponses sont conservées : réessayez plus tard ou écrivez-nous sur WhatsApp.",
  done: {
    title: "Demande envoyée.",
    reference: "Votre référence",
    text: (delai: string) => `Nous vous répondons avec votre devis sous ${delai}.`,
    pdf: "Télécharger le récapitulatif (PDF)",
    pdfNote: "Ce document résume votre demande. Ce n'est ni un devis ni une facture : aucun prix n'est fixé à ce stade.",
    home: "Retour à l'accueil",
    emailed: "Une copie a été transmise à CheyClean.",
  },
  groups: {
    contact: "Vos coordonnées",
    company: "La société",
    billing: "Adresse de facturation",
    site: "Le lieu à nettoyer",
    need: "Votre besoin",
    formula: "Formule",
  },
};

/** Libellés des champs, groupés par étape. */
export const labels = {
  firstName: "Prénom",
  lastName: "Nom",
  email: "Email",
  phone: "Téléphone",
  street: "Rue et numéro",
  postalCode: "Code postal",
  city: "Ville",
  companyName: "Nom de la société",
  vatNumber: "Numéro d'entreprise ou de TVA",
  vatHelp: "Exemple : BE 0123.456.789",
  billingStreet: "Rue et numéro",
  billingPostalCode: "Code postal",
  billingCity: "Ville",
  billingCountry: "Pays",
  contactFirstName: "Prénom du contact",
  contactLastName: "Nom du contact",
  contactRole: "Fonction (facultatif)",
  siteSameAsBilling: "Le lieu à nettoyer est à l'adresse de facturation",
  siteStreet: "Rue et numéro du lieu",
  sitePostalCode: "Code postal du lieu",
  siteCity: "Ville du lieu",
  placeType: "Type de lieu",
  surface: "Surface approximative (m²)",
  surfaceHelp: "Une estimation suffit.",
  frequency: "Fréquence souhaitée",
  nature: "Nature de la demande",
  description: "Décrivez votre besoin",
  descriptionHelp: "Sols délicats, grandes vitres, animaux, accès, horaires…",
  preferredSchedule: "Horaires d'intervention souhaités (facultatif)",
  select: "Choisir",
};

export const errors = {
  required: (champ: string) => `Indiquez votre ${champ} pour continuer.`,
  email: "Cette adresse email n'est pas valide. Vérifiez qu'elle contient un @.",
  phone: "Ce numéro semble incomplet. Vérifiez-le, par exemple 0486 37 45 48.",
  postalCode: "Un code postal belge compte 4 chiffres, par exemple 1000.",
  vat: "Ce numéro n'est pas valide. Vérifiez les chiffres, par exemple BE 0123.456.789.",
  surface: "Indiquez une surface entre 5 et 100 000 m².",
  description: "Décrivez votre besoin en quelques mots (au moins 10 caractères).",
  tooLong: "Ce texte est trop long.",
  choose: (champ: string) => `Choisissez ${champ} pour continuer.`,
  consent: "Cochez la case de consentement pour envoyer votre demande.",
};
