import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { about } from "@/content/fr";

export const metadata: Metadata = { title: "À propos", description: about.meta, alternates: { canonical: "/a-propos" } };

export default function Page() {
  return (
    <>
      <PageHero h1={about.h1} intro={about.intro} action={{ href: "/devis", label: "Demander mon devis" }} />

      <section data-chapter="light" className="section">
        <div className="container-x grid12 gap-y-12">
          <div className="col-span-12 md:col-span-4">
            <Reveal>
              <Photo name="escalier" ratio="4 / 5" position="50% 45%" sizes="(min-width: 768px) 33vw, 100vw" />
            </Reveal>
          </div>
          <div className="col-span-12 md:col-span-6 md:col-start-7">
            <Reveal>
              <h2 className="max-w-[12ch]">{about.methodTitle}</h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="lead mt-8" style={{ fontSize: "clamp(1.5rem, 1rem + 1vw, 1.75rem)", maxWidth: "30ch" }}>
                {about.method}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section data-chapter="light" className="field-brume section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[14ch]">{about.commitmentsTitle}</h2>
          </Reveal>
          <div className="grid12 mt-14 gap-y-12 md:mt-20">
            <ul className="col-span-12 grid gap-10 md:col-span-7">
              {about.commitments.map((c, i) => (
                <Reveal as="li" key={c.t} delay={i * 80}>
                  <h3 className="font-bold tracking-tight" style={{ fontSize: "clamp(2rem, 1rem + 3vw, 3.75rem)", lineHeight: 1, letterSpacing: "-0.035em" }}>
                    {c.t}
                  </h3>
                  <p className="mt-3 max-w-[40ch]">{c.d}</p>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={140} className="col-span-12 md:col-span-4 md:col-start-9">
              <Photo name="arche" ratio="4 / 5" position="50% 50%" />
            </Reveal>
          </div>
        </div>
      </section>

      <section data-chapter="light" className="section">
        <div className="container-x grid12 gap-y-12">
          <div className="col-span-12 md:col-span-6">
            <Reveal>
              <h2 className="max-w-[10ch]">{about.productsTitle}</h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="lead mt-8" style={{ fontSize: "clamp(1.5rem, 1rem + 1vw, 1.75rem)", maxWidth: "30ch" }}>
                {about.products}
              </p>
            </Reveal>
            <Reveal delay={180}>
              <Link href="/devis" className="btn btn-primary mt-10">
                Demander mon devis
              </Link>
            </Reveal>
          </div>
          <Reveal delay={140} className="col-span-12 md:col-span-4 md:col-start-9">
            <Photo name="sol" ratio="4 / 5" position="50% 55%" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
