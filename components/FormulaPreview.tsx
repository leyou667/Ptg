"use client";

import { useState } from "react";
import { formulas, type Profile } from "@/content/fr";
import { FormulaCards } from "./FormulaCards";

const tabs: { id: Profile; label: string }[] = [
  { id: "particulier", label: "Particuliers" },
  { id: "societe", label: "Sociétés" },
];

export function FormulaPreview({ tone = "brume" }: { tone?: "papier" | "brume" }) {
  const [profile, setProfile] = useState<Profile>("particulier");
  return (
    <div>
      <div role="group" aria-label="Choisir un profil" className="mb-12 inline-flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={profile === t.id}
            onClick={() => setProfile(t.id)}
            className={`btn min-h-11 py-2 ${profile === t.id ? "btn-primary" : "btn-ghost"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="md:py-6">
        <FormulaCards items={formulas[profile]} profile={profile} tone={tone} />
      </div>
    </div>
  );
}
