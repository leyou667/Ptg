import Link from "next/link";

type Action = { href: string; label: string };

/** Premier écran de texte : l'énoncé occupe la largeur, l'énoncé de soutien en bas à gauche, l'action en bas à droite. */
export function PageHero({ h1, intro, action, secondary, compact }: { h1: string; intro?: string; action?: Action; secondary?: Action; compact?: boolean }) {
  return (
    <section id="contenu" data-chapter="light" className={`container-x flex flex-col justify-between gap-12 pb-10 pt-10 md:pb-14 md:pt-16 ${compact ? "" : "min-h-[calc(72svh-4rem)]"}`}>
      <h1 className="rise">{h1}</h1>
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        {intro && (
          <p className="lead rise" style={{ "--d": "140ms" } as React.CSSProperties}>
            {intro}
          </p>
        )}
        {(action || secondary) && (
          <div className="rise flex flex-wrap gap-3" style={{ "--d": "260ms" } as React.CSSProperties}>
            {action && (
              <Link href={action.href} className="btn btn-primary">
                {action.label}
              </Link>
            )}
            {secondary && (
              <Link href={secondary.href} className="btn btn-ghost">
                {secondary.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
