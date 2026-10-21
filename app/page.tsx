import Link from "next/link";
import type { Metadata } from "next";
import { Intro } from "@/components/Intro";
import { FormulaPreview } from "@/components/FormulaPreview";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { Steps } from "@/components/Steps";
import { faq, home, site } from "@/content/fr";
import { whatsappLink } from "@/lib/config";
import { faqSchema, localBusiness } from "@/lib/schema-org";

export const metadata: Metadata = {
  title: { absolute: `${site.name}, société de nettoyage en Belgique | Abonnement et devis` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const a = home.audiences;
  const f = home.finalCta;
  const words = [
    { href: "/particuliers", word: a.particuliers.title, text: a.particuliers.text, cta: a.particuliers.cta },
    { href: "/societes", word: a.societes.title, text: a.societes.text, cta: a.societes.cta },
  ];
  return (
    <>
      <Intro />

      <section id="contenu" data-chapter="light" className="section scroll-mt-16">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[18ch]">{a.title}</h2>
          </Reveal>
          <div className="grid12 mt-16 gap-y-12 md:mt-24">
            <div className="col-span-12 grid gap-14 md:col-span-7">
              {words.map((w, i) => (
                <Reveal key={w.href} delay={i * 90}>
                  <Link href={w.href} className="big-link group">
                    <span className="block font-bold tracking-tight" style={{ fontSize: "clamp(2.75rem, 8.2vw, 8rem)", lineHeight: 0.95, letterSpacing: "-0.045em" }}>
                      {w.word}
                    </span>
                    <span className="mt-4 block max-w-[38ch]">
                      {w.text} <span className="font-semibold underline decoration-cyan decoration-4 underline-offset-8">{w.cta}</span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Reveal delay={160} className="col-span-12 md:col-span-4 md:col-start-9">
              <Photo name="salon" ratio="4 / 5" position="50% 60%" sizes="(min-width: 768px) 33vw, 100vw" />
            </Reveal>
          </div>
        </div>
      </section>

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
            <FormulaPreview tone="papier" />
          </div>
        </div>
      </section>

      <section data-chapter="light" className="field-brume section">
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

      <section data-chapter="dark" className="field-marine on-dark flex min-h-[min(100svh,56rem)] flex-col py-14 md:py-20">
        <div className="container-x relative flex flex-1 flex-col text-center">
          <Reveal className="flex flex-1 flex-col">
            <h2 className="flex flex-1 flex-col justify-between" style={{ fontSize: "clamp(2.75rem, 9.5vw, 9rem)", lineHeight: 0.95 }}>
              <span>{f.line1}</span>
              <span>{f.line2}</span>
            </h2>
          </Reveal>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
            <Reveal delay={90} className="pointer-events-auto mx-auto flex max-w-xl flex-col items-center gap-5">
              <div className="flex w-full flex-col items-center gap-3 md:flex-row md:justify-center md:gap-10">
                <Link href="/devis" className="btn btn-cyan w-full md:w-auto md:min-w-52">
                  {f.button}
                </Link>
                <span className="soft">{f.or}</span>
                <a href={whatsappLink(site.whatsappGreeting)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full md:w-auto md:min-w-52">
                  {site.whatsappLabel}
                </a>
              </div>
              <p className="soft small max-w-[40ch]">{f.text}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <JsonLd data={localBusiness} />
      <JsonLd data={faqSchema(faq)} />
    </>
  );
}
