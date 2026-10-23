import type { Profile } from "@/content/fr";
import { Reveal } from "../Reveal";
import { PricingSection } from "./PricingSection";

/** Section « Trois formules » : cartes en verre sur le fond animé. */
export function FormulaSection({ title, text, defaultProfile }: { title: string; text?: string; defaultProfile: Profile }) {
  return (
    <section className="section text-[17px] text-foreground">
      <div className="container-x">
        <Reveal>
          <h2 className="max-w-[20ch]">
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
