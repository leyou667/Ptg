import Link from "next/link";
import { home } from "@/content/fr";

type Action = { href: string; label: string };

/** Premier écran de texte : le titre, la phrase de soutien, puis l'action et ce qui rassure, sans vide entre eux. */
export function PageHero({ h1, intro, action, secondary }: { h1: string; intro?: string; action?: Action; secondary?: Action; compact?: boolean }) {
  return (
    <section id="contenu" data-chapter="light" className="container-x flex flex-col gap-8 pb-12 pt-12 md:gap-10 md:pb-20 md:pt-20">
      <h1 className="rise max-w-[16ch]">{h1}</h1>
      {intro && (
        <p className="lead rise" style={{ "--d": "140ms" } as React.CSSProperties}>
          {intro}
        </p>
      )}
      {(action || secondary) && (
        <div className="rise grid gap-4" style={{ "--d": "260ms" } as React.CSSProperties}>
          <div className="flex flex-wrap gap-3">
            {action && (
              <Link href={action.href} className="btn btn-primary min-h-14 px-8 text-lg">
                {action.label}
              </Link>
            )}
            {secondary && (
              <Link href={secondary.href} className="btn btn-ghost min-h-14 px-8 text-lg">
                {secondary.label}
              </Link>
            )}
          </div>
          {action && <p className="max-w-[44ch] text-[0.9375rem] text-muted-foreground">{home.reassurance}</p>}
        </div>
      )}
    </section>
  );
}
