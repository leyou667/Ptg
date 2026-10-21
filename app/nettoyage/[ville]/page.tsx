import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { FormulaCards } from "@/components/FormulaCards";
import { cities, cityPage, formulas } from "@/content/fr";

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
  return (
    <>
      <PageHero h1={cityPage.h1(city.name)} intro={cityPage.intro(city.name)}>
        <Link href={`/devis?ville=${encodeURIComponent(city.name)}`} className="btn btn-primary">
          {cityPage.cta}
        </Link>
      </PageHero>
      <section className="section section-alt">
        <div className="container-x">
          <h2>Les formules pour les sociétés à {city.name}</h2>
          <div className="mt-12 md:py-5">
            <FormulaCards items={formulas.societe} profile="societe" />
          </div>
        </div>
      </section>
    </>
  );
}
