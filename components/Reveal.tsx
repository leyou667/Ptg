"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  /** Décalage en ms : titre, puis texte, puis image, par pas de 60 à 90 ms. */
  delay?: number;
  className?: string;
  as?: "div" | "p" | "li" | "section" | "span";
};

/**
 * Entrée au défilement : monte de 28 px en fondu, une seule fois. Le contenu est visible dans le HTML ;
 * le script n'arme que ce qui est sous le pli, donc rien ne reste caché si le script échoue.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.setAttribute("data-reveal", "hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        // Deux images pour que la transition parte bien de l'état masqué.
        requestAnimationFrame(() => el.setAttribute("data-reveal", "shown"));
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Any = Tag as React.ElementType;
  return (
    <Any ref={ref} className={className} style={{ "--d": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Any>
  );
}
