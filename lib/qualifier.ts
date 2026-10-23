import { formulas, frequencies, placeTypes, qualifierFallback, qualifierPlaces, qualifierSurfaces, type FormulaId, type Profile } from "@/content/fr";

/** Réponses du mini-parcours : libellés de lieu et de fréquence identiques à ceux du formulaire de devis. */
export type Answers = { lieu: string; surface: string; frequence: string };

export const PROFILES: Profile[] = ["particulier", "societe"];
export const formulaIds = (profile: Profile): FormulaId[] => formulas[profile].map((f) => f.id);
export const lieuOptions = (profile: Profile) => qualifierPlaces[profile].map((p) => p.label);
export const surfaceIds = (profile: Profile) => qualifierSurfaces[profile].map((s) => s.id);

export function isValidAnswers(profile: Profile, a: Answers): boolean {
  return lieuOptions(profile).includes(a.lieu) && surfaceIds(profile).includes(a.surface) && (frequencies as string[]).includes(a.frequence);
}

const freqScore = (f: string) => (f === "Plusieurs fois par semaine" ? 2 : f === "Chaque semaine" ? 1 : 0);

/**
 * Règles simples, sans IA : plus la surface et la fréquence montent, plus la formule monte.
 * Un lieu qui accueille beaucoup de monde (villa, école, salle de sport) ajoute un point.
 */
export function fallbackFormula(profile: Profile, a: Answers): FormulaId {
  const surf = qualifierSurfaces[profile].find((s) => s.id === a.surface)?.score ?? 0;
  const extra = a.lieu === "Villa" || a.lieu === "École" || a.lieu === "Salle de sport" ? 1 : 0;
  const total = freqScore(a.frequence) + surf + extra;
  const mid: FormulaId = profile === "societe" ? "pro" : "confort";
  return total <= 1 ? "essentiel" : total <= 3 ? mid : "premium";
}

export function fallbackAdvice(profile: Profile, formula: FormulaId, a: Answers): string {
  const phrase = qualifierPlaces[profile].find((p) => p.label === a.lieu)?.phrase ?? (profile === "societe" ? "votre lieu" : "votre logement");
  return qualifierFallback[formula].replace("{lieu}", phrase);
}

/** Lien vers le devis existant, prérempli avec les réponses (le formulaire revalide tout). */
export function devisHref(profile: Profile, formula: FormulaId, a: Answers): string {
  const value = qualifierSurfaces[profile].find((s) => s.id === a.surface)?.value ?? "";
  const q = new URLSearchParams({ formule: formula, lieu: a.lieu, surface: String(value), frequence: a.frequence });
  return `/devis/${profile}?${q.toString()}`;
}

export type Prefill = { placeType?: string; surface?: string; frequency?: string; nature?: string };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lit les paramètres d'URL du devis : seules des valeurs connues sont acceptées, le reste est ignoré. */
export function parsePrefill(profile: Profile, sp: Record<string, string | string[] | undefined>): Prefill {
  const out: Prefill = {};
  const lieu = first(sp.lieu);
  if (lieu && (placeTypes[profile] as string[]).includes(lieu)) out.placeType = lieu;
  const surface = Number(first(sp.surface));
  if (Number.isInteger(surface) && surface >= 5 && surface <= 100000) out.surface = String(surface);
  const freq = first(sp.frequence);
  if (freq && (frequencies as string[]).includes(freq)) {
    out.frequency = freq;
    // Un abonnement est un entretien régulier ; pour « une seule fois », on laisse choisir.
    if (freq !== "Une seule fois") out.nature = "entretien-regulier";
  }
  return out;
}
