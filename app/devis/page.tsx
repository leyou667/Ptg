import type { Metadata } from "next";
import { QuoteFlow } from "@/components/QuoteFlow";

export const metadata: Metadata = {
  title: "Demander un devis de nettoyage",
  description: "Décrivez votre lieu, choisissez une formule et recevez un devis de nettoyage sur mesure. Conseil par assistant IA disponible.",
  alternates: { canonical: "/devis" },
};

type SP = Promise<{ [k: string]: string | string[] | undefined }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return (
    <div id="contenu">
      <QuoteFlow initial={{ profil: one(sp.profil), formule: one(sp.formule), ville: one(sp.ville) }} />
    </div>
  );
}
