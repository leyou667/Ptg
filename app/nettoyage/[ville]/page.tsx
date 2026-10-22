import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { FormulaCards } from "@/components/FormulaCards";
import { Faq } from "@/components/Faq";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { cities, cityPage, faq, formulas } from "@/content/fr";

type Params = { ville: string };

export const dynamicParams = false;
export function generateStaticParams() {
  return cities.map((c) => ({ ville: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { ville } = await params;
  const city = cities.find((c) => c.slug === ville);
  if (!city) return {};
  return {
    title: cityPage.h1(city.name),
    description: cityPage.meta(city.name),
    alternates: { canonical: `/nettoyage/${city.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { ville } = await params;
  const city = cities.find((c) => c.slug === ville);
  if (!city) notFound();
  const devis = "/devis";
  return (
    <>
      <PageHero h1={cityPage.h1(city.name)} intro={cityPage.intro(city.name)} action={{ href: devis, label: cityPage.cta }} />

      <section data-chapter="light" className="field-stone section">
        <div className="container-x">
          <div className="grid12 items-end gap-y-8">
            <Reveal className="col-span-12 md:col-span-7">
              <h2 className="max-w-[16ch]">Les formules pour les sociétés à {city.name}</h2>
            </Reveal>
            <Reveal delay={120} className="col-span-12 md:col-span-4 md:col-start-9">
              <Photo name="escalier" ratio="16 / 10" position="50% 40%" sizes="(min-width: 768px) 33vw, 100vw" />
            </Reveal>
          </div>
          <div className="mt-16 md:py-6">
            <FormulaCards items={formulas.societe} profile="societe" tone="ground" />
          </div>
        </div>
      </section>

      <section data-chapter="light" className="section">
        <div className="container-x grid12 gap-y-12">
          <div className="col-span-12 md:col-span-3">
            <Reveal>
              <Photo name="arche" ratio="4 / 5" position="50% 50%" sizes="(min-width: 768px) 25vw, 100vw" />
            </Reveal>
          </div>
          <div className="col-span-12 md:col-span-8 md:col-start-5">
            <Reveal>
              <h2 className="max-w-[14ch]">Questions fréquentes</h2>
            </Reveal>
            <div className="mt-12">
              <Faq items={faq} onField="ground" />
            </div>
          </div>
        </div>
      </section>

      <section data-chapter="dark" className="field-ink on-dark section">
        <div className="container-x grid12 items-end gap-y-10">
          <div className="col-span-12 md:col-span-7">
            <Reveal>
              <h2 className="max-w-[12ch]">Parlons de votre lieu.</h2>
            </Reveal>
            <Reveal delay={90}>
              <Link href={devis} className="btn btn-cyan mt-10">
                {cityPage.cta}
              </Link>
            </Reveal>
          </div>
          <Reveal delay={140} className="col-span-12 md:col-span-4 md:col-start-9">
            <Photo name="salon" ratio="4 / 5" position="50% 60%" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
