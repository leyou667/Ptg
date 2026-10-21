"use client";

import { useState } from "react";
import { formulas, type Profile } from "@/content/fr";
import { FormulaCards } from "./FormulaCards";

const tabs: { id: Profile; label: string }[] = [
  { id: "particulier", label: "Particuliers" },
  { id: "societe", label: "Sociétés" },
];

export function FormulaPreview() {
  const [profile, setProfile] = useState<Profile>("particulier");
  return (
    <div>
      <div role="group" aria-label="Choisir un profil" className="mb-10 inline-flex rounded-full border border-ligne bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={profile === t.id}
            onClick={() => setProfile(t.id)}
            className={`min-h-11 rounded-full px-6 font-semibold transition-colors ${profile === t.id ? "bg-marine text-white" : "hover:bg-brume"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="md:py-5">
        <FormulaCards items={formulas[profile]} profile={profile} />
      </div>
    </div>
  );
}
