import type { Metadata } from "next";
import { Questionnaire } from "@/components/questionnaire/Questionnaire";
import { flow } from "@/content/questionnaire";

export const metadata: Metadata = {
  title: flow.particulier.h1,
  description: "Décrivez votre besoin en quatre étapes courtes et recevez un devis de nettoyage sur mesure.",
  alternates: { canonical: "/devis/particulier" },
  robots: { index: false },
};

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const formule = Array.isArray(sp.formule) ? sp.formule[0] : sp.formule;
  return (
    <div id="contenu" data-chapter="light">
      <Questionnaire profile="particulier" initialFormula={formule} />
    </div>
  );
}
