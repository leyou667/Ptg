import { PageHero } from "./PageHero";

export function LegalPage({ h1, sections }: { h1: string; sections: { t: string; d: string }[] }) {
  return (
    <>
      <PageHero h1={h1} />
      <section className="section pt-0">
        <div className="container-x grid gap-10">
          {sections.map((s) => (
            <div key={s.t} className="grid gap-3 border-t border-ligne pt-6 md:grid-cols-[1fr_2fr]">
              <h2 className="text-2xl">{s.t}</h2>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
