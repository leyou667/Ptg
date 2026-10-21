import Link from "next/link";
import type { Metadata } from "next";
import { Intro } from "@/components/Intro";
import { FormulaPreview } from "@/components/FormulaPreview";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { faq, home, site } from "@/content/fr";
import { faqSchema, localBusiness } from "@/lib/schema-org";

export const metadata: Metadata = {
  title: { absolute: `${site.name}, société de nettoyage en Belgique | Abonnement et devis` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const a = home.audiences;
  return (
    <>
      <h1 className="sr-only">CheyClean, société de nettoyage en Belgique, en abonnement</h1>
      <Intro />

      <section id="contenu" className="section scroll-mt-16">
        <div className="container-x">
          <h2 className="max-w-[20ch]">{a.title}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Link href="/particuliers" className="panel group flex min-h-72 flex-col justify-between p-8 transition-colors hover:border-marine">
              <div>
                <h3 className="text-3xl">{a.particuliers.title}</h3>
                <p className="mt-4 text-marine-soft">{a.particuliers.text}</p>
              </div>
              <span className="mt-8 font-semibold underline decoration-cyan decoration-2 underline-offset-8">{a.particuliers.cta}</span>
            </Link>
            <Link href="/societes" className="panel on-dark group flex min-h-72 flex-col justify-between border-marine bg-marine p-8 text-white transition-colors hover:bg-[#17325f]">
              <div>
                <h3 className="text-3xl">{a.societes.title}</h3>
                <p className="mt-4 text-white/85">{a.societes.text}</p>
              </div>
              <span className="mt-8 font-semibold underline decoration-cyan decoration-2 underline-offset-8">{a.societes.cta}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container-x">
          <h2 className="max-w-[22ch]">{home.formulas.title}</h2>
          <p className="mt-5 text-lg text-marine-soft">{home.formulas.text}</p>
          <div className="mt-10">
            <FormulaPreview />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2>{home.faqTitle}</h2>
          <Faq items={faq} />
        </div>
      </section>

      <section className="on-dark section bg-marine text-white">
        <div className="container-x">
          <h2 className="max-w-[16ch]">{home.finalCta.title}</h2>
          <p className="mt-5 text-xl text-white/85">{home.finalCta.text}</p>
          <Link href="/devis" className="btn btn-cyan mt-8">
            {home.finalCta.button}
          </Link>
        </div>
      </section>

      <JsonLd data={localBusiness} />
      <JsonLd data={faqSchema(faq)} />
    </>
  );
}
