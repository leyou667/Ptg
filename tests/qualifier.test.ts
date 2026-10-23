import { describe, expect, it } from "vitest";
import { frequencies, qualifierFallback } from "@/content/fr";
import { devisHref, fallbackAdvice, fallbackFormula, formulaIds, isValidAnswers, parsePrefill } from "@/lib/qualifier";

const A = (lieu: string, surface: string, frequence: string) => ({ lieu, surface, frequence });

describe("recommandation sans IA", () => {
  it("monte avec la surface et la fréquence", () => {
    expect(fallbackFormula("particulier", A("Appartement", "s1", "Chaque mois"))).toBe("essentiel");
    expect(fallbackFormula("particulier", A("Appartement", "s2", "Chaque semaine"))).toBe("confort");
    expect(fallbackFormula("particulier", A("Villa", "s4", "Plusieurs fois par semaine"))).toBe("premium");
    expect(fallbackFormula("societe", A("Bureaux", "s1", "Toutes les deux semaines"))).toBe("essentiel");
    expect(fallbackFormula("societe", A("Bureaux", "s3", "Chaque semaine"))).toBe("pro");
    expect(fallbackFormula("societe", A("École", "s4", "Plusieurs fois par semaine"))).toBe("premium");
  });
  it("ne propose que des formules qui existent pour le profil", () => {
    for (const profile of ["particulier", "societe"] as const) {
      for (const s of ["s1", "s2", "s3", "s4"]) {
        for (const f of frequencies) {
          const lieux = profile === "societe" ? ["Bureaux", "Commerce", "École", "Salle de sport"] : ["Appartement", "Maison", "Villa"];
          for (const l of lieux) expect(formulaIds(profile)).toContain(fallbackFormula(profile, A(l, s, f)));
        }
      }
    }
  });
  it("le conseil de repli cite le lieu, invite au devis et ne contient aucun prix", () => {
    const t = fallbackAdvice("societe", "pro", A("Bureaux", "s2", "Chaque semaine"));
    expect(t).toContain("vos bureaux");
    expect(t).toMatch(/devis gratuit/);
    for (const v of Object.values(qualifierFallback)) expect(v).not.toMatch(/[€$]|\d/);
    expect(t.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3);
  });
});

describe("validation et préremplissage", () => {
  it("refuse des réponses hors liste", () => {
    expect(isValidAnswers("particulier", A("Bureaux", "s1", "Chaque semaine"))).toBe(false);
    expect(isValidAnswers("particulier", A("Maison", "s9", "Chaque semaine"))).toBe(false);
    expect(isValidAnswers("particulier", A("Maison", "s1", "Tous les jours"))).toBe(false);
    expect(isValidAnswers("societe", A("Commerce", "s2", "Chaque mois"))).toBe(true);
  });
  it("le lien de devis porte les réponses et revient identique après lecture", () => {
    const href = devisHref("societe", "pro", A("Commerce", "s2", "Chaque semaine"));
    expect(href.startsWith("/devis/societe?")).toBe(true);
    const sp = Object.fromEntries(new URL(href, "https://x.test").searchParams);
    expect(sp.formule).toBe("pro");
    expect(parsePrefill("societe", sp)).toEqual({ placeType: "Commerce", surface: "200", frequency: "Chaque semaine", nature: "entretien-regulier" });
  });
  it("ignore ce qui n'est pas connu (injection, valeurs absurdes)", () => {
    expect(parsePrefill("particulier", { lieu: "<script>", surface: "-5", frequence: "jamais" })).toEqual({});
    expect(parsePrefill("particulier", { lieu: "Bureaux" })).toEqual({});
    expect(parsePrefill("particulier", { surface: "2000000" })).toEqual({});
    expect(parsePrefill("particulier", { frequence: "Une seule fois" })).toEqual({ frequency: "Une seule fois" });
  });
});
