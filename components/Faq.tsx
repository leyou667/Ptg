import { Reveal } from "./Reveal";

/** Questions sans filets : l'ouverture d'une ligne pose une tuile d'un pas de tonalité derrière elle. */
export function Faq({ items, onField = "stone" }: { items: { q: string; a: string }[]; onField?: "stone" | "ground" }) {
  return (
    <div className="grid gap-3">
      {items.map((i, n) => (
        <Reveal key={i.q} delay={n * 70}>
          <details className={`group transition-colors duration-300 open:bg-card rounded-2xl`}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 px-5 py-4 text-[1.125rem] font-medium leading-snug md:text-[1.375rem] tracking-tight md:px-6 [&::-webkit-details-marker]:hidden">
              {i.q}
              <span aria-hidden className="relative h-5 w-5 shrink-0">
                <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 bg-current" />
                <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
              </span>
            </summary>
            <p className="px-5 pb-6 text-[1.125rem] md:px-6">{i.a}</p>
          </details>
        </Reveal>
      ))}
    </div>
  );
}
