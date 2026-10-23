"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { home } from "@/content/fr";
import { Illustration } from "./illustrations/Illustration";
import { SceneCalendar, SceneCards, SceneQuote, SceneRoom } from "./illustrations/scenes";
import { Star } from "./Star";

type Step = { t: string; d: string };

const scenes = [SceneRoom, SceneCards, SceneQuote, SceneCalendar];

/**
 * « Comment ça marche » : une ligne de temps verticale. La ligne se remplit en cyan au fil du défilement,
 * une étincelle en marque la pointe ; chaque étape est un nœud numéroté (allumé, actif avec halo, ou atténué).
 * Sans script, tout reste visible et allumé.
 */
export function Steps({ steps }: { steps: Step[] }) {
  const list = useRef<HTMLOListElement>(null);
  const spark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const items = Array.from(ol.querySelectorAll<HTMLElement>("[data-step]"));
    const nodes = items.map((li) => li.querySelector<HTMLElement>("[data-node]")!);
    const segs = items.map((li) => li.querySelector<HTMLElement>("[data-seg]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const states: string[] = [];

    const update = () => {
      raf = 0;
      const anchor = window.innerHeight * 0.58; // la ligne se remplit jusqu'à ce repère, à l'écran
      const centers = nodes.map((n) => n.getBoundingClientRect().top + n.offsetHeight / 2);
      let active = -1;
      centers.forEach((c, i) => {
        if (anchor >= c) active = i;
      });
      items.forEach((li, i) => {
        const st = i < active ? "done" : i === active ? "active" : "idle";
        if (states[i] !== st) {
          states[i] = st;
          li.setAttribute("data-state", st);
        }
        const seg = segs[i];
        if (seg && i < items.length - 1) {
          const h = centers[i + 1] - centers[i];
          const p = h > 0 ? Math.min(1, Math.max(0, (anchor - centers[i]) / h)) : 0;
          seg.style.transform = `scaleY(${p})`;
        }
      });
      if (spark.current) {
        const first = centers[0];
        const last = centers[centers.length - 1];
        const y = Math.min(last, Math.max(first, anchor));
        const top = ol.getBoundingClientRect().top;
        spark.current.style.transform = `translate3d(0, ${(y - top).toFixed(1)}px, 0)`;
        spark.current.style.opacity = anchor < first - 40 || anchor > last + 400 ? "0" : "1";
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (reduce) ol.setAttribute("data-reduce", "true");
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const total = steps.length;
  const node =
    "absolute left-[-3.5rem] top-0 z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-primary/40 bg-background text-[0.9375rem] font-semibold tabular-nums text-muted-foreground transition-[background-color,box-shadow,color,border-color] duration-500 motion-reduce:transition-none md:left-[-6rem] md:h-14 md:w-14 md:text-lg " +
    "group-data-[state=done]/step:border-primary group-data-[state=done]/step:bg-primary group-data-[state=done]/step:text-primary-foreground " +
    "group-data-[state=active]/step:border-primary group-data-[state=active]/step:bg-primary group-data-[state=active]/step:text-primary-foreground group-data-[state=active]/step:shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_22%,transparent),0_0_32px_8px_color-mix(in_srgb,var(--primary)_55%,transparent)]";

  return (
    <section id="contenu" data-chapter="dark" className="field-ink on-dark section scroll-mt-16">
      <div className="container-x">
        <ol ref={list} className="relative mx-auto max-w-6xl pl-14 md:pl-24">
          <div ref={spark} aria-hidden className="pointer-events-none absolute left-5 top-0 z-20 -ml-[0.5rem] -mt-[0.5rem] w-4 opacity-0 transition-opacity duration-300 md:left-7 md:-ml-[0.625rem] md:w-5">
            <Star className="h-4 w-4 text-primary drop-shadow-[0_0_8px_var(--primary)] md:h-5 md:w-5" />
          </div>
          {steps.map((s, i) => {
            const Scene = scenes[i];
            return (
              <li key={s.t} data-step data-state="done" className="group/step relative pb-16 md:pb-24">
                <span data-node className={node} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* Segment de ligne : du centre de ce nœud au centre du suivant. */}
                <span aria-hidden className="absolute left-[-2.25rem] top-5 -bottom-5 w-[3px] -translate-x-1/2 rounded-full bg-primary/20 md:left-[-4.25rem] md:top-7 md:-bottom-7">
                  <span data-seg className="absolute inset-0 origin-top rounded-full bg-primary" style={{ transform: "scaleY(1)" }} />
                </span>
                <div className="grid gap-6 transition-colors duration-500 group-data-[state=idle]/step:text-idle md:grid-cols-[minmax(0,1fr)_16rem] md:items-center md:gap-12 motion-reduce:transition-none">
                  <div>
                    <p className="sr-only">{`Étape ${i + 1} sur ${total}`}</p>
                    {i === 0 ? (
                      <h2 className="max-w-[18ch]">{s.t}</h2>
                    ) : (
                      <p className="max-w-[20ch] font-display font-semibold" style={{ fontSize: "clamp(1.75rem, 1rem + 2.6vw, 3.25rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}>
                        {s.t}
                      </p>
                    )}
                    <p className="mt-4 max-w-[36ch] text-[1.0625rem] md:text-[1.125rem]">{s.d}</p>
                  </div>
                  <Illustration label={home.stepIllustrations[i]} className="transition-opacity duration-500 group-data-[state=idle]/step:opacity-60 md:h-64 md:w-64 md:justify-self-end">
                    <Scene />
                  </Illustration>
                </div>
              </li>
            );
          })}
          <li data-step data-state="done" className="group/step relative">
            <span
              data-node
              aria-hidden
              className="absolute left-[-3.5rem] top-0 z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-primary/40 bg-background text-primary transition-[background-color,box-shadow,color,border-color] duration-500 motion-reduce:transition-none md:left-[-6rem] md:h-14 md:w-14 group-data-[state=active]/step:border-primary group-data-[state=active]/step:bg-primary group-data-[state=active]/step:text-primary-foreground group-data-[state=active]/step:shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_22%,transparent),0_0_32px_8px_color-mix(in_srgb,var(--primary)_55%,transparent)] group-data-[state=done]/step:border-primary group-data-[state=done]/step:bg-primary group-data-[state=done]/step:text-primary-foreground"
            >
              <Star className="h-5 w-5 md:h-7 md:w-7" />
            </span>
            <div className="flex min-h-10 items-center md:min-h-14">
              <Link href="/devis" className="btn btn-primary">
                {home.stepsCta}
              </Link>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
