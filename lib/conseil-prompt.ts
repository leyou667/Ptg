import { formulas, qualifierPlaces, qualifierSurfaces, type Profile } from "@/content/fr";
import type { Answers } from "./qualifier";

const lines = (p: Profile) =>
  formulas[p]
    .map((f) => `- ${f.id} (${f.name}) : ${f.tagline} ${f.rows.map((r) => `${r.label} : ${r.value}.`).join(" ")}`)
    .join("\n");

/** Consignes fixes : le visiteur ne peut y toucher (ses réponses sont des valeurs d'une liste, validées côté serveur). */
export function conseilSystemPrompt(profile: Profile) {
  return `Tu es le conseiller de CheyClean, société de nettoyage en abonnement en Belgique. Tu vouvoies, ton chaleureux et professionnel, en français.

On te donne les réponses d'un visiteur (type de lieu, surface, fréquence). Tu choisis UNE formule d'abonnement parmi celles-ci, et seulement celles-ci :
${lines(profile)}

Réponds uniquement par un objet JSON, sans texte autour, de la forme : {"formule":"<id>","conseil":"<texte>"}
- "formule" vaut exactement l'un de : ${formulas[profile].map((f) => f.id).join(", ")}.
- "conseil" : 3 phrases au maximum, qui expliquent pourquoi cette formule convient à ce lieu, à cette surface et à cette fréquence. Termine en invitant à demander un devis gratuit.
- Ne donne JAMAIS de prix précis, de fourchette, de tarif, de remise ni d'engagement : le prix est fixé dans le devis, après échange.
- N'invente rien sur CheyClean (pas de chiffres, d'avis, de certifications). Pas de Markdown.`;
}

export function conseilUserMessage(profile: Profile, a: Answers) {
  const surface = qualifierSurfaces[profile].find((s) => s.id === a.surface)?.label ?? a.surface;
  const phrase = qualifierPlaces[profile].find((p) => p.label === a.lieu)?.phrase ?? a.lieu;
  return `Profil : ${profile === "societe" ? "société" : "particulier"}. Lieu : ${a.lieu} (${phrase}). Surface : ${surface}. Fréquence souhaitée : ${a.frequence}.`;
}
