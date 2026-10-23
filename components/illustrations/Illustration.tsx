"use client";

import { useEffect, useRef } from "react";

type Props = { label: string; children: React.ReactNode; className?: string };

/**
 * Enveloppe d'une illustration animée.
 * - Entrée « pop » quand elle arrive à l'écran (IntersectionObserver) ; le contenu reste visible sans script.
 * - Boucle de vie douce, mise en pause hors écran (data-vis).
 * - Petit rebond au toucher ou au survol.
 * Tout est en CSS (transform et opacity) ; reduced-motion : version statique, voir .ill dans globals.css.
 */
export function Illustration({ label, children, className = "" }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const timer = useRef(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const below = el.getBoundingClientRect().top > window.innerHeight * 0.92;
    if (below) el.setAttribute("data-ill", "armed");
    el.setAttribute("data-vis", below ? "0" : "1");
    if (!below) el.setAttribute("data-ill", "on");
    const io = new IntersectionObserver(
      ([e]) => {
        el.setAttribute("data-vis", e.isIntersecting ? "1" : "0");
        if (e.isIntersecting && el.getAttribute("data-ill") === "armed") requestAnimationFrame(() => el.setAttribute("data-ill", "on"));
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const bounce = () => {
    const h = hop.current;
    if (!h || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    h.classList.remove("is-hop");
    void h.offsetWidth; // relance l'animation
    h.classList.add("is-hop");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => h.classList.remove("is-hop"), 600);
  };

  return (
    <div ref={root} role="img" aria-label={label} className={`ill ${className}`} onPointerEnter={bounce} onPointerDown={bounce}>
      <div ref={hop} className="ill-hop h-full w-full">
        {children}
      </div>
    </div>
  );
}
