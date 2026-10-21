import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { about } from "@/content/fr";

export const metadata: Metadata = { title: "À propos", description: about.meta, alternates: { canonical: "/a-propos" } };

export default function Page() {
  return (
    <>
      <PageHero h1={about.h1} intro={about.intro} />
      <section className="section section-alt">
        <div className="container-x grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2>{about.methodTitle}</h2>
          <p className="text-lg">{about.method}</p>
        </div>
      </section>
      <section className="section">
        <div className="container-x">
          <h2>{about.commitmentsTitle}</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {about.commitments.map((c) => (
              <li key={c.t} className="border-t border-marine/25 pt-5">
                <h3>{c.t}</h3>
                <p className="mt-2 text-marine-soft">{c.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section section-alt">
        <div className="container-x grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2>{about.productsTitle}</h2>
          <p className="text-lg">{about.products}</p>
        </div>
      </section>
    </>
  );
}
