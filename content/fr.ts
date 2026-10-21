export type Profile = "particulier" | "societe";
export type FormulaId = "essentiel" | "confort" | "pro" | "premium";

export type Formula = {
  id: FormulaId;
  name: string;
  tagline: string;
  recommended?: boolean;
  /** Lignes comparables, alignées entre les formules d'un même profil. */
  rows: { label: string; value: string }[];
};

export const site = {
  name: "CheyClean",
  locale: "fr-BE",
  tagline: "L'éclat du propre, en abonnement.",
  description:
    "CheyClean, société de nettoyage en Belgique : bureaux, salles de sport, écoles, commerces et domiciles. Formules en abonnement, devis sur mesure.",
  phoneDisplay: "+32 486 37 45 48",
  phoneHref: "tel:+32486374548",
  whatsappLabel: "Écrire sur WhatsApp",
  whatsappGreeting: "Bonjour CheyClean, je souhaite un devis.",
};

export const nav = [
  { href: "/particuliers", label: "Particuliers" },
  { href: "/societes", label: "Sociétés" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export const intro = {
  scrollHint: "Faites défiler",
  skip: "Passer l'intro",
  cta: "Demander mon devis",
  lines: [
    "Chaque détail compte.",
    "Des surfaces qui reflètent votre exigence.",
    "Un service discret, ponctuel, irréprochable.",
    "Partout en Belgique, à chaque étape.",
    "CheyClean, l'éclat du propre, en abonnement.",
  ],
  posterAlt: "Intérieur d'une villa lumineuse avec sol en marbre, nettoyé par CheyClean",
};

export const formulas: Record<Profile, Formula[]> = {
  particulier: [
    {
      id: "essentiel",
      name: "Essentiel",
      tagline: "Un intérieur toujours net, sans y penser.",
      rows: [
        { label: "Inclus", value: "Sols, poussières, cuisine, sanitaires" },
        { label: "Fréquence", value: "Toutes les deux semaines" },
        { label: "Options", value: "Vitres intérieures" },
      ],
    },
    {
      id: "confort",
      name: "Confort",
      tagline: "Le bon équilibre pour une maison qui vit.",
      recommended: true,
      rows: [
        { label: "Inclus", value: "Essentiel, plus literie, électroménager, vitres intérieures" },
        { label: "Fréquence", value: "Chaque semaine" },
        { label: "Options", value: "Repassage, vitres extérieures, produits sans parfum" },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      tagline: "Un niveau d'exigence digne d'une villa.",
      rows: [
        { label: "Inclus", value: "Confort, plus entretien des sols délicats et des surfaces nobles" },
        { label: "Fréquence", value: "Plusieurs fois par semaine" },
        { label: "Options", value: "Intendante dédiée, remise des clés, entretien du jardin d'hiver" },
      ],
    },
  ],
  societe: [
    {
      id: "essentiel",
      name: "Essentiel",
      tagline: "Des locaux propres, une présence discrète.",
      rows: [
        { label: "Inclus", value: "Sols, poubelles, sanitaires, points de contact" },
        { label: "Fréquence", value: "Chaque semaine" },
        { label: "Options", value: "Vitres intérieures" },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "L'entretien complet pour des équipes au quotidien.",
      recommended: true,
      rows: [
        { label: "Inclus", value: "Essentiel, plus postes de travail, cuisine, salles de réunion" },
        { label: "Fréquence", value: "Plusieurs fois par semaine" },
        { label: "Options", value: "Désinfection renforcée, vitres, fournitures sanitaires" },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      tagline: "Une image irréprochable, jour après jour.",
      rows: [
        { label: "Inclus", value: "Pro, plus intervention avant ouverture et contrôle qualité" },
        { label: "Fréquence", value: "Tous les jours ouvrables" },
        { label: "Options", value: "Responsable de site, remise en état périodique, astreinte" },
      ],
    },
  ],
};

export const placeTypes: Record<Profile, string[]> = {
  particulier: ["Appartement", "Maison", "Villa", "Après travaux", "Autre lieu"],
  societe: ["Bureaux", "Salle de sport", "École", "Bibliothèque", "Commerce", "Autre lieu"],
};

export const frequencies = [
  "Plusieurs fois par semaine",
  "Chaque semaine",
  "Toutes les deux semaines",
  "Chaque mois",
];

export const quote = {
  title: "Demandez votre devis",
  intro: "Répondez à quelques questions et recevez un devis sur mesure.",
  summaryTitle: "Votre demande",
  summaryEmpty: "Vos réponses apparaîtront ici.",
  summaryToggle: "Voir votre demande",
  back: "Retour",
  next: "Continuer",
  steps: ["Profil", "Lieu", "Formule", "Coordonnées", "Confirmation"],
  profile: {
    question: "Pour qui est ce nettoyage ?",
    particulier: { title: "Un particulier", text: "Appartement, maison, villa." },
    societe: { title: "Une société", text: "Bureaux, écoles, commerces." },
  },
  type: { question: "Quel type de lieu ?" },
  surface: { question: "Quelle surface environ ?", help: "Une estimation suffit.", unit: "m²" },
  frequency: { question: "À quelle fréquence ?" },
  city: { question: "Dans quelle ville ?", label: "Ville ou code postal" },
  note: {
    question: "Quelque chose à nous signaler ?",
    help: "Sols délicats, grandes vitres, animaux…",
    label: "Remarque (facultatif)",
  },
  formulas: {
    title: "Voici les formules qui correspondent à votre lieu.",
    recommended: "Recommandée pour vous",
    choose: "Choisir cette formule",
    chosen: "Formule choisie",
    unsure: "Pas sûr de votre choix ?",
    advice: "Demander conseil",
  },
  contact: {
    title: "Vos coordonnées",
    name: "Nom complet",
    phone: "Téléphone",
    email: "Email",
    consent: "J'accepte que CheyClean utilise ces informations pour répondre à ma demande.",
    privacy: "Politique de confidentialité",
    send: "Envoyer ma demande",
    sending: "Envoi en cours…",
    whatsapp: "Envoyer par WhatsApp",
  },
  done: {
    title: "Demande envoyée.",
    text: (delai: string) => `Nous vous répondons avec votre devis sous ${delai}.`,
    home: "Retour à l'accueil",
  },
  errors: {
    phone: "Ce numéro semble incomplet. Vérifiez-le, par exemple 0486 37 45 48.",
    email: "Cette adresse email n'est pas valide. Vérifiez qu'elle contient un @.",
    required: (champ: string) => `Indiquez votre ${champ} pour continuer.`,
    consent: "Cochez la case de consentement pour envoyer votre demande.",
    send: "L'envoi a échoué. Vos réponses sont conservées : réessayez, ou écrivez-nous sur WhatsApp.",
  },
  whatsappMessage: (d: {
    profil: string;
    type: string;
    surface: number | string;
    ville: string;
    frequence: string;
    formule: string;
  }) =>
    `Bonjour CheyClean, je souhaite un devis. Profil : ${d.profil}. Lieu : ${d.type}, ${d.surface} m², ${d.ville}. Fréquence : ${d.frequence}. Formule : ${d.formule}.`,
};

export const advisor = {
  name: "Assistant CheyClean",
  open: "Demander conseil",
  close: "Fermer l'assistant",
  welcome:
    "Bonjour, je suis l'assistant CheyClean. Décrivez-moi votre lieu et ce que vous attendez, je vous conseille une formule. Je ne donne pas de prix : ils sont fixés dans votre devis.",
  placeholder: "Ex. : appartement de 80 m², parquet, deux chats",
  send: "Envoyer",
  thinking: "J'analyse votre besoin…",
  choose: "Choisir cette formule",
  others: "Voir les autres formules",
  offTopic:
    "Je peux seulement vous aider pour le nettoyage et les formules CheyClean. Pour autre chose, écrivez-nous sur WhatsApp.",
  unavailable:
    "L'assistant est indisponible pour le moment. Vous pouvez continuer sans lui ou nous écrire sur WhatsApp.",
  gdpr: "Vos messages servent uniquement à vous conseiller. Ils ne sont pas conservés.",
  limit: "Cette conversation a atteint sa limite. Continuez avec le formulaire ou écrivez-nous sur WhatsApp.",
};

export const home = {
  statement: "CheyClean, société de nettoyage en abonnement partout en Belgique.",
  steps: [
    { t: "D'abord, vous décrivez votre lieu.", d: "Type de lieu, surface, ville et fréquence : quatre réponses suffisent." },
    { t: "Ensuite, vous choisissez une formule.", d: "Trois formules par profil, ou l'avis de notre assistant si vous hésitez." },
    { t: "Nous vous envoyons un devis.", d: "Sur mesure, avec un prix fixé après échange avec vous." },
    { t: "Puis nous intervenons à jours fixes.", d: "Une équipe attitrée, aux horaires convenus, en toute discrétion." },
  ],
  audiences: {
    title: "Un nettoyage pensé pour votre lieu",
    particuliers: {
      title: "Particuliers",
      text: "Votre intérieur entretenu avec soin, à la fréquence qui vous convient.",
      cta: "Voir les formules pour la maison",
    },
    societes: {
      title: "Sociétés",
      text: "Bureaux, salles de sport, écoles, bibliothèques et commerces : des locaux impeccables sans perturber votre activité.",
      cta: "Voir les formules pour les locaux",
    },
  },
  formulas: {
    title: "Trois formules, un seul niveau d'exigence",
    text: "Chaque formule se règle sur votre lieu. Le prix est fixé dans votre devis, après échange avec vous.",
  },
  faqTitle: "Questions fréquentes",
  finalCta: {
    title: "Parlons de votre lieu.",
    line1: "On commence",
    line2: "par votre lieu ?",
    text: "Quelques questions suffisent pour recevoir un devis sur mesure. Vous préférez parler ? Écrivez-nous sur WhatsApp.",
    button: "Demander mon devis",
    or: "ou",
  },
};

export const faq = [
  {
    q: "Comment fonctionne l'abonnement ?",
    a: "Vous choisissez une formule et une fréquence. Nous intervenons à jours et horaires fixes, avec une équipe qui connaît votre lieu.",
  },
  {
    q: "Comment obtenir un prix ?",
    a: "Tout se fait sur devis. Décrivez votre lieu dans le parcours de devis : nous vous répondons avec une proposition adaptée.",
  },
  {
    q: "Intervenez-vous partout en Belgique ?",
    a: "Oui. Nous couvrons Bruxelles, Liège, Anvers, Gand, Charleroi et leurs environs. Indiquez votre ville dans le devis pour confirmer.",
  },
  {
    q: "Fournissez-vous le matériel et les produits ?",
    a: "Oui. Nous apportons le matériel et les produits. Si vous préférez des produits sans parfum ou spécifiques, signalez-le dans votre demande.",
  },
  {
    q: "Puis-je modifier ou arrêter mon abonnement ?",
    a: "Les conditions sont précisées dans votre devis. Parlez-en avec nous avant de vous engager : nous cherchons une solution qui vous convient.",
  },
];

export const audiencePages = {
  particulier: {
    path: "/particuliers",
    h1: "Le nettoyage de votre maison",
    meta: "Nettoyage à domicile en Belgique : appartement, maison, villa, après travaux. Formules en abonnement, devis sur mesure.",
    intro:
      "Un intérieur net sans y penser, en abonnement, par une équipe régulière.",
    servicesTitle: "Ce que nous entretenons",
    services: [
      { t: "Appartements et maisons", d: "Sols, cuisine, sanitaires, poussières et surfaces, à votre rythme." },
      { t: "Villas et grandes surfaces", d: "Matières nobles, marbre, parquet et grandes vitres traités avec les bons produits." },
      { t: "Après travaux", d: "Remise en état complète avant votre emménagement." },
    ],
    methodTitle: "Notre méthode",
    method: [
      { t: "Visite et écoute", d: "Nous notons vos surfaces, vos matières et vos priorités." },
      { t: "Un plan d'entretien", d: "Une liste claire de gestes, adaptée à chaque pièce." },
      { t: "Une équipe attitrée", d: "Les mêmes personnes, aux mêmes horaires, en toute discrétion." },
      { t: "Un suivi régulier", d: "Un point de contact unique pour ajuster la prestation." },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "Dois-je être présent pendant le nettoyage ?", a: "Non, si vous le souhaitez. Nous convenons ensemble de la remise des clés." },
      { q: "Pouvez-vous traiter les sols délicats ?", a: "Oui. Signalez-les dans votre demande : nous adaptons les produits et les gestes." },
      { q: "Les animaux sont-ils un problème ?", a: "Non. Indiquez-les dans votre devis pour que l'équipe s'organise." },
    ],
    cta: "Demander mon devis",
  },
  societe: {
    path: "/societes",
    h1: "Le nettoyage de vos locaux",
    meta: "Nettoyage de bureaux, salles de sport, écoles, bibliothèques et commerces en Belgique. Abonnement et devis sur mesure.",
    intro:
      "Des locaux impeccables en abonnement, sans perturber votre activité.",
    servicesTitle: "Les lieux que nous entretenons",
    services: [
      { t: "Bureaux", d: "Postes de travail, salles de réunion, cuisines et sanitaires." },
      { t: "Salles de sport", d: "Sols, vestiaires et équipements, avec une hygiène renforcée." },
      { t: "Écoles et bibliothèques", d: "Salles, circulations et sanitaires, en dehors des heures d'accueil." },
      { t: "Commerces", d: "Vitrines, surfaces de vente et réserves, avant l'ouverture." },
    ],
    methodTitle: "Notre méthode",
    method: [
      { t: "Audit du site", d: "Nous visitons les lieux et relevons les zones sensibles." },
      { t: "Un cahier des charges", d: "Tâches, fréquences et horaires validés avec vous." },
      { t: "Des équipes formées", d: "Du personnel stable, formé à vos consignes d'accès." },
      { t: "Un contrôle qualité", d: "Des points réguliers pour ajuster et corriger sans délai." },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "Pouvez-vous intervenir en dehors des heures de travail ?", a: "Oui, tôt le matin, le soir ou le week-end, selon votre activité." },
      { q: "Gérez-vous plusieurs sites ?", a: "Oui. Nous coordonnons plusieurs lieux avec un seul interlocuteur." },
      { q: "Peut-on ajouter une désinfection renforcée ?", a: "Oui, en option dans les formules Pro et Premium." },
    ],
    cta: "Demander mon devis",
  },
};

export const about = {
  h1: "À propos de CheyClean",
  meta: "La méthode, les engagements et les produits de CheyClean, société de nettoyage en Belgique.",
  intro:
    "Société de nettoyage belge, nous entretenons domiciles et locaux professionnels en abonnement.",
  methodTitle: "Notre méthode",
  method:
    "Chaque lieu a ses matières, ses usages et son rythme. Nous commençons par écouter, puis nous établissons un plan d'entretien précis. Une équipe attitrée l'applique et un interlocuteur unique assure le suivi.",
  commitmentsTitle: "Nos engagements",
  commitments: [
    { t: "Discrétion", d: "Nous respectons votre lieu, vos horaires et votre vie privée." },
    { t: "Ponctualité", d: "Nous intervenons aux horaires convenus, sans exception." },
    { t: "Exigence", d: "Chaque intervention suit une liste de contrôle." },
    { t: "Transparence", d: "Tout est écrit dans votre devis, sans mauvaise surprise." },
  ],
  productsTitle: "Nos produits",
  products:
    "Nous apportons nos produits et notre matériel. Nous choisissons des produits adaptés à chaque matière et proposons des alternatives sans parfum sur demande.",
};

export const contact = {
  h1: "Contact",
  meta: "Contactez CheyClean par téléphone, WhatsApp ou via le parcours de devis.",
  intro: "Pour un devis, le parcours guidé est le plus rapide. Pour le reste, écrivez-nous.",
  phone: "Téléphone",
  whatsapp: "WhatsApp",
  quote: "Demander mon devis",
  zone: "Zone d'intervention",
  zoneText: "Partout en Belgique : Bruxelles, Liège, Anvers, Gand, Charleroi et leurs environs.",
};

export const cities = [
  { slug: "bruxelles", name: "Bruxelles" },
  { slug: "liege", name: "Liège" },
  { slug: "anvers", name: "Anvers" },
  { slug: "gand", name: "Gand" },
  { slug: "charleroi", name: "Charleroi" },
];

export const cityPage = {
  h1: (city: string) => `Nettoyage à ${city}`,
  meta: (city: string) =>
    `Nettoyage de bureaux, commerces et domiciles à ${city}. Abonnement et devis sur mesure avec CheyClean.`,
  intro: (city: string) => `Bureaux, commerces et domiciles à ${city} : une équipe régulière, des horaires fixes, un devis sur mesure.`,
  cta: "Demander mon devis",
};

export const footer = {
  legal: [
    { href: "/mentions-legales", label: "Mentions légales" },
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/cookies", label: "Cookies" },
  ],
  cities: "Villes",
  rights: "CheyClean. Tous droits réservés.",
};

export const cookies = {
  text: "Nous utilisons des cookies pour mesurer l'audience. Vous choisissez.",
  accept: "Accepter",
  refuse: "Refuser",
};

export const legal = {
  mentions: {
    h1: "Mentions légales",
    meta: "Mentions légales du site CheyClean.",
    sections: [
      {
        t: "Éditeur du site",
        d: "CheyClean, société de nettoyage en Belgique. Dénomination sociale, forme juridique, adresse du siège, numéro d'entreprise (BCE) et numéro de TVA : à compléter par CheyClean avant la mise en ligne.",
      },
      { t: "Contact", d: "Téléphone et WhatsApp : +32 486 37 45 48. Email : voir la page Contact." },
      { t: "Hébergement", d: "Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis." },
      {
        t: "Propriété intellectuelle",
        d: "Les textes, images, vidéos et le logo de CheyClean sont protégés. Toute reproduction sans autorisation écrite est interdite.",
      },
    ],
  },
  privacy: {
    h1: "Politique de confidentialité",
    meta: "Comment CheyClean traite vos données personnelles.",
    sections: [
      {
        t: "Données collectées",
        d: "Via le parcours de devis : nom, téléphone, email, ville, description du lieu et remarque. Nous ne collectons que ce qui est nécessaire pour répondre à votre demande.",
      },
      {
        t: "Finalité et base légale",
        d: "Répondre à votre demande de devis, sur la base de votre consentement et de mesures précontractuelles prises à votre demande (RGPD, art. 6).",
      },
      {
        t: "Assistant IA",
        d: "Les messages envoyés à l'assistant sont traités par un prestataire d'intelligence artificielle (Anthropic) uniquement pour générer la réponse. CheyClean ne les conserve pas. Ne saisissez pas de données sensibles.",
      },
      {
        t: "Conservation",
        d: "Les demandes de devis sont conservées au maximum 24 mois, puis supprimées. Durée à confirmer par CheyClean.",
      },
      {
        t: "Vos droits",
        d: "Vous pouvez accéder à vos données, les rectifier, les effacer, vous opposer à leur traitement ou retirer votre consentement. Contactez-nous par téléphone ou WhatsApp. Vous pouvez aussi saisir l'Autorité de protection des données (autoriteprotectiondonnees.be).",
      },
    ],
  },
  cookies: {
    h1: "Cookies",
    meta: "Les cookies utilisés par le site CheyClean.",
    sections: [
      {
        t: "Cookies nécessaires",
        d: "Le site mémorise votre choix concernant les cookies. Ce stockage est nécessaire et ne demande pas de consentement.",
      },
      {
        t: "Mesure d'audience",
        d: "Avec votre accord seulement, nous mesurons l'audience avec Vercel Web Analytics, sans publicité ni profilage. Si vous refusez, rien n'est chargé.",
      },
      { t: "Changer d'avis", d: "Effacez les données du site dans votre navigateur : le bandeau s'affichera de nouveau." },
    ],
  },
};
