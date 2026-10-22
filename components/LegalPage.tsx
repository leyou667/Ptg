import { PageHero } from "./PageHero";
import { Reveal } from "./Reveal";

export function LegalPage({ h1, intro, sections }: { h1: string; intro?: string; sections: { t: string; d: string }[] }) {
  return (
    <>
      <PageHero h1={h1} intro={intro} compact />
      <section data-chapter="light" className="field-stone section">
        <div className="container-x grid gap-14">
          {sections.map((s, i) => (
            <div key={s.t} className="grid12 gap-y-3">
              <Reveal className="col-span-12 md:col-span-5" delay={(i % 3) * 40}>
                <h2 style={{ fontSize: "clamp(1.5rem, 1rem + 1.4vw, 2.25rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>{s.t}</h2>
              </Reveal>
              <Reveal className="col-span-12 md:col-span-6 md:col-start-7" delay={90 + (i % 3) * 40}>
                <p>{s.d}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
