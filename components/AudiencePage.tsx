import Link from "next/link";
import { audiencePages, formulas, type Profile } from "@/content/fr";
import { FormulaCards } from "./FormulaCards";
import { Faq } from "./Faq";
import { JsonLd } from "./JsonLd";
import { PageHero } from "./PageHero";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";
import { faqSchema, serviceSchema } from "@/lib/schema-org";

const pics = {
  particulier: { services: "sol", method: "escalier", cta: "fenetre", pos: "50% 55%" },
  societe: { services: "arche", method: "salon", cta: "sol", pos: "50% 50%" },
} as const;

export function AudiencePage({ profile }: { profile: Profile }) {
  const p = audiencePages[profile];
  const pic = pics[profile];
  const devis = `/devis/${profile === "societe" ? "societe" : "particulier"}`;
  return (
    <>
      <PageHero h1={p.h1} intro={p.intro} action={{ href: devis, label: p.cta }} />

      {/* Les lieux, un par ligne, en grand ; une image de l'autre côté de la grille. */}
      <section data-chapter="light" className="field-stone section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[16ch]">{p.servicesTitle}</h2>
          </Reveal>
          <div className="grid12 mt-14 gap-y-12 md:mt-20">
            <ul className="col-span-12 grid gap-10 md:col-span-7">
              {p.services.map((s, i) => (
                <Reveal as="li" key={s.t} delay={i * 80}>
                  <h3 className="font-bold tracking-tight" style={{ fontSize: "clamp(2rem, 1rem + 3vw, 3.75rem)", lineHeight: 1, letterSpacing: "-0.035em" }}>
                    {s.t}
                  </h3>
                  <p className="mt-3 max-w-[40ch]">{s.d}</p>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={140} className="col-span-12 md:col-span-4 md:col-start-9">
              <Photo name={pic.services} ratio="4 / 5" position={pic.pos} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* La méthode : des énoncés, pas une liste de cartes. */}
      <section data-chapter="light" className="section">
        <div className="container-x grid12 gap-y-12">
          <div className="col-span-12 md:col-span-5">
            <Reveal>
              <h2 className="max-w-[12ch]">{p.methodTitle}</h2>
            </Reveal>
            <Reveal delay={100} className="mt-10 hidden md:block">
              <Photo name={pic.method} ratio="1 / 1" position="50% 45%" sizes="30vw" />
            </Reveal>
          </div>
          <ol className="col-span-12 grid gap-9 md:col-span-6 md:col-start-7">
            {p.method.map((m, i) => (
              <Reveal as="li" key={m.t} delay={i * 80}>
                <p className="lead">
                  <strong className="font-bold">{m.t}.</strong> {m.d}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section data-chapter="light" className="field-stone section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[18ch]">Trois formules, un seul niveau d&apos;exigence</h2>
          </Reveal>
          <div className="mt-16 md:py-6">
            <FormulaCards items={formulas[profile]} profile={profile} tone="ground" />
          </div>
        </div>
      </section>

      <section data-chapter="light" className="section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[14ch]">{p.faqTitle}</h2>
          </Reveal>
          <div className="grid12 mt-12 md:mt-16">
            <div className="col-span-12 md:col-span-8 md:col-start-5">
              <Faq items={p.faq} onField="ground" />
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
                {p.cta}
              </Link>
            </Reveal>
          </div>
          <Reveal delay={140} className="col-span-12 md:col-span-4 md:col-start-9">
            <Photo name={pic.cta} ratio="4 / 5" position="50% 50%" />
          </Reveal>
        </div>
      </section>
      <JsonLd data={serviceSchema(p.h1, p.meta, p.path)} />
      <JsonLd data={faqSchema(p.faq)} />
    </>
  );
}
