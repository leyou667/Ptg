"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Formula, FormulaId, Profile } from "@/content/fr";
import { quote } from "@/content/fr";
import { Star } from "./Star";

type Props = {
  items: Formula[];
  profile: Profile;
  selected?: FormulaId | null;
  /** Mode parcours : bouton qui appelle onChoose. Sinon lien vers /devis. */
  onChoose?: (id: FormulaId) => void;
};

/**
 * Trois formules côte à côte. Sur ordinateur : la recommandée est plus grande, en ink. Sur téléphone : un carrousel
 * qu'on fait glisser, la formule du milieu s'agrandit, ses voisines dépassent des deux côtés. Chaque formule porte
 * une ombre (elle flotte au-dessus du fond).
 */
export function FormulaCards({ items, profile, selected, onChoose }: Props) {
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    let frame = 0;
    const apply = () => {
      frame = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      for (const c of cards) {
        const centre = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.min(1, Math.abs(centre - mid) / c.offsetWidth);
        c.style.setProperty("--s", String(1.04 - 0.14 * d));
        c.style.setProperty("--o", String(1 - 0.35 * d));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    // Au départ : la formule recommandée (ou choisie) est au milieu.
    const start = cards[Math.max(0, items.findIndex((f) => (selected ? f.id === selected : f.recommended)))];
    if (start && el.scrollWidth > el.clientWidth) el.scrollLeft = start.offsetLeft + start.offsetWidth / 2 - el.clientWidth / 2;
    apply();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // Position de départ seulement : choisir une formule ne doit pas faire sauter le carrousel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div
      ref={rail}
      tabIndex={-1}
      className="-mx-5 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-[11%] py-10 [scrollbar-width:none] md:mx-0 md:grid md:snap-none md:grid-cols-[1fr_1.14fr_1fr] md:gap-x-6 md:overflow-visible md:px-0 md:py-6 [&::-webkit-scrollbar]:hidden"
    >
      {items.map((f) => {
        const rec = !!f.recommended;
        const isSel = selected === f.id;
        return (
          <article
            key={f.id}
            data-card
            aria-label={`Formule ${f.name}`}
            className={`flex w-[78%] shrink-0 snap-center flex-col rounded-[28px] p-6 shadow-flotte transition-[box-shadow] max-md:[opacity:var(--o,1)] max-md:[transform:scale(var(--s,1))] md:w-auto md:p-9 ${
              rec ? "glass ring-2 ring-primary md:-my-6 md:py-14" : "glass"
            } ${isSel ? "outline outline-4 outline-offset-[-4px] outline-primary" : ""}`}
          >
            <header className="pb-6">
              <h3 className={`flex items-center gap-3 ${rec ? "text-[2.25rem]" : "text-[1.75rem]"}`}>
                {f.name}
                {rec && <Star className="h-5 w-5 text-primary" />}
              </h3>
              {rec && <p className="mt-2 font-semibold text-primary">{quote.formulas.recommended}</p>}
              <p className={`mt-3 ${rec ? "text-foreground/85" : "soft"}`}>{f.tagline}</p>
            </header>
            {f.rows.map((r) => (
              <div key={r.label} className="py-4">
                <p className={`small font-semibold ${rec ? "text-primary" : "soft"}`}>{r.label}</p>
                <p className="mt-1">{r.value}</p>
              </div>
            ))}
            <div className="mt-auto pt-6">
              {onChoose ? (
                <button type="button" className={`btn w-full ${rec ? "btn-primary" : "btn-ghost"}`} aria-pressed={isSel} onClick={() => onChoose(f.id)}>
                  {isSel ? quote.formulas.chosen : quote.formulas.choose}
                </button>
              ) : (
                <Link href={`/devis/${profile === "societe" ? "societe" : "particulier"}?formule=${f.id}`} className={`btn w-full ${rec ? "btn-primary" : "btn-ghost"}`}>
                  {quote.formulas.choose}
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
