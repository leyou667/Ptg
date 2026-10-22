import type { Metadata } from "next";
import { ChoiceTiles } from "@/components/ChoiceTiles";
import { Intro } from "@/components/Intro";
import { FormulaPreview } from "@/components/FormulaPreview";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Steps } from "@/components/Steps";
import { faq, home, site } from "@/content/fr";
import { choice } from "@/content/questionnaire";
import { faqSchema, localBusiness } from "@/lib/schema-org";

export const metadata: Metadata = {
  title: { absolute: `${site.name}, société de nettoyage en Belgique | Abonnement et devis` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Intro />

      <Steps steps={home.steps} />

      <section data-chapter="light" className="section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[18ch]">{home.formulas.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="lead mt-6">{home.formulas.text}</p>
          </Reveal>
          <div className="mt-14">
            <FormulaPreview tone="ground" />
          </div>
        </div>
      </section>

      <section data-chapter="light" className="field-stone section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[14ch]">{home.faqTitle}</h2>
          </Reveal>
          <div className="grid12 mt-12 md:mt-16">
            <div className="col-span-12 md:col-span-8 md:col-start-5">
              <Faq items={faq} />
            </div>
          </div>
        </div>
      </section>

      <section data-chapter="dark" className="field-ink on-dark section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[14ch]">{choice.title}</h2>
          </Reveal>
          <Reveal delay={90}>
            <ChoiceTiles className="mt-12" onDark />
          </Reveal>
        </div>
      </section>

      <JsonLd data={localBusiness} />
      <JsonLd data={faqSchema(faq)} />
    </>
  );
}
