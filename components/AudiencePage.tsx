import Link from "next/link";
import { audiencePages, formulas, type Profile } from "@/content/fr";
import { FormulaCards } from "./FormulaCards";
import { Faq } from "./Faq";
import { JsonLd } from "./JsonLd";
import { PageHero } from "./PageHero";
import { faqSchema, serviceSchema } from "@/lib/schema-org";

export function AudiencePage({ profile }: { profile: Profile }) {
  const p = audiencePages[profile];
  return (
    <>
      <PageHero h1={p.h1} intro={p.intro}>
        <Link href={`/devis?profil=${profile}`} className="btn btn-primary">
          {p.cta}
        </Link>
      </PageHero>

      <section className="section section-alt">
        <div className="container-x">
          <h2>{p.servicesTitle}</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {p.services.map((s) => (
              <li key={s.t} className="border-t border-marine/25 pt-5">
                <h3>{s.t}</h3>
                <p className="mt-2 text-marine-soft">{s.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <h2>{p.methodTitle}</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {p.method.map((m) => (
              <li key={m.t}>
                <h3>{m.t}</h3>
                <p className="mt-2 text-marine-soft">{m.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container-x">
          <h2 className="max-w-[22ch]">Trois formules, un seul niveau d&apos;exigence</h2>
          <div className="mt-12 md:py-5">
            <FormulaCards items={formulas[profile]} profile={profile} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2>{p.faqTitle}</h2>
          <Faq items={p.faq} />
        </div>
      </section>

      <section className="on-dark section bg-marine text-white">
        <div className="container-x">
          <h2 className="max-w-[16ch]">Parlons de votre lieu.</h2>
          <Link href={`/devis?profil=${profile}`} className="btn btn-cyan mt-8">
            {p.cta}
          </Link>
        </div>
      </section>
      <JsonLd data={serviceSchema(p.h1, p.meta, p.path)} />
      <JsonLd data={faqSchema(p.faq)} />
    </>
  );
}
