import type { Metadata } from "next";
import { ChoiceTiles } from "@/components/ChoiceTiles";
import { choice } from "@/content/questionnaire";

export const metadata: Metadata = {
  title: "Demander un devis de nettoyage",
  description: "Particulier ou société : choisissez votre profil et décrivez votre besoin pour recevoir un devis de nettoyage sur mesure.",
  alternates: { canonical: "/devis" },
};

export default function Page() {
  return (
    <section id="contenu" data-chapter="light" className="container-x flex min-h-[calc(100svh-4rem)] flex-col justify-between gap-12 pb-10 pt-10 md:pt-16">
      <div>
        <h1 className="rise max-w-[14ch]">{choice.title}</h1>
        <p className="lead rise mt-6" style={{ "--d": "100ms" } as React.CSSProperties}>
          {choice.sub}
        </p>
      </div>
      <ChoiceTiles animate />
    </section>
  );
}
