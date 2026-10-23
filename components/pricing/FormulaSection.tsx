import type { Profile } from "@/content/fr";
import { Reveal } from "../Reveal";
import { fraunces, inter } from "./fonts";
import { PricingSection } from "./PricingSection";

/** Section « Trois formules » : thème « Atelier clair », Fraunces pour les titres et Inter pour le texte. */
export function FormulaSection({ title, text, defaultProfile }: { title: string; text?: string; defaultProfile: Profile }) {
  return (
    <section
      data-chapter="light"
      className={`${fraunces.variable} ${inter.variable} section bg-background font-[family-name:var(--font-inter)] text-[17px] text-foreground`}
    >
      <div className="container-x">
        <Reveal>
          <h2 className="max-w-[20ch] font-[family-name:var(--font-fraunces)] text-[36px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[56px]">
            {title}
          </h2>
        </Reveal>
        {text && (
          <Reveal delay={80}>
            <p className="mt-6 max-w-[52ch] text-[17px] text-muted-foreground">{text}</p>
          </Reveal>
        )}
        <div className="mt-12 md:mt-16">
          <PricingSection defaultProfile={defaultProfile} />
        </div>
      </div>
    </section>
  );
}
