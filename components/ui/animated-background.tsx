"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

type Props = {
  /** Force des lueurs, de 0 à 1. Le plafond d'opacité garde le texte lisible (contraste AA mesuré). */
  intensity?: number;
  /** Vitesse de rattrapage du curseur (0,06 à 0,1 : fluide, avec du retard). */
  followSpeed?: number;
  /** Grain fin par-dessus. */
  grain?: boolean;
  /** Surcharge facultative des couleurs. Par défaut : les variables --glow-* de globals.css. */
  colors?: { deep?: string; mid?: string; light?: string; core?: string };
};

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n' x='0' y='0' width='100%25' height='100%25'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

/** Opacité maximale des lueurs : réglée pour que le texte secondaire reste à 4,5:1 au moins (mesuré, voir le rapport). */
const ALPHA_CAP = 0.34;

/**
 * Une lueur = un grand disque dégradé (bleu profond → bleu moyen → cyan clair → cœur clair), sans bord net.
 * Les lueurs sont des calques déplacés par `transform` : le navigateur les anime sur le processeur graphique,
 * sans repeindre la page à chaque image (un canvas plein écran coûtait ~15 % de processeur dans nos mesures).
 */
const glowImage = (a: number, c: { core: string; light: string; mid: string; deep: string }) => {
  const mix = (color: string, k: number) => `color-mix(in srgb, ${color} ${(a * k * 100).toFixed(1)}%, transparent)`;
  return `radial-gradient(closest-side, ${mix(c.core, 0.55)} 0%, ${mix(c.light, 0.7)} 18%, ${mix(c.mid, 0.85)} 45%, ${mix(c.deep, 1)} 75%, transparent 100%)`;
};

export function AnimatedBackground({ intensity = 0.8, followSpeed = 0.08, grain = true, colors }: Props) {
  const pathname = usePathname();
  const hidden = pathname?.startsWith("/admin");
  const wrapRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const palette = useMemo(
    () => ({
      core: colors?.core ?? "var(--glow-core)",
      light: colors?.light ?? "var(--glow-light)",
      mid: colors?.mid ?? "var(--glow-mid)",
      deep: colors?.deep ?? "var(--glow-deep)",
    }),
    [colors],
  );

  useEffect(() => {
    if (hidden) return;
    const wrap = wrapRef.current;
    const mainEl = mainRef.current;
    const secondEl = secondRef.current;
    const topEl = topRef.current;
    if (!wrap || !mainEl || !secondEl || !topEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // Mobile et tablette : dérive seule, plus légère (amplitude réduite).
    const sway = fine ? 1 : 0.6;

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    // Tailles des lueurs, relatives au plus grand côté de l'écran.
    const sizes = { main: 0, second: 0, top: 0 };
    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      const m = Math.max(vw, vh);
      sizes.main = m * 1.3;
      sizes.second = m * 1.0;
      sizes.top = m * 1.4;
      mainEl.style.width = mainEl.style.height = `${sizes.main}px`;
      secondEl.style.width = secondEl.style.height = `${sizes.second}px`;
      topEl.style.width = topEl.style.height = `${sizes.top}px`;
    };
    measure();

    // Position du curseur dans un ref, jamais dans l'état React : aucun rendu.
    const pointer = { x: 0.7, y: 0.8, active: false };
    const main = { x: 0.78, y: 0.95 };
    const second = { x: 0.3, y: 0.85 };
    let activeMix = 0; // 0 = dérive seule, 1 = suit le curseur
    let raf = 0;
    let running = false;
    let last = 0;
    const t0 = performance.now();
    // Garde-fou : si l'appareil tient moins de ~35 images/s, on retire les lueurs secondaires (le fond reste animé).
    let slow = 0;
    let seen = 0;
    let lean = false;

    const place = (el: HTMLElement, size: number, x: number, y: number) => {
      el.style.transform = `translate3d(${(x * vw - size / 2).toFixed(1)}px, ${(y * vh - size / 2).toFixed(1)}px, 0)`;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      const dt = Math.min(64, now - (last || now));
      last = now;
      if (!lean && dt > 0) {
        seen++;
        if (dt > 28) slow++;
        if (seen === 90) {
          if (slow > 50) {
            lean = true;
            secondEl.style.visibility = topEl.style.visibility = "hidden";
          }
          seen = slow = 0;
        }
      }
      // Rattrapage indépendant de la fréquence de l'écran : même ressenti à 60 et à 144 Hz.
      const k = 1 - Math.pow(1 - followSpeed, dt / 16.67);
      const k2 = 1 - Math.pow(1 - followSpeed * 0.45, dt / 16.67);
      const t = (now - t0) / 1000;

      // Dérive autonome : sinusoïdes lentes, cycles d'environ 17 à 25 s.
      const d1 = { x: 0.78 + 0.1 * sway * Math.sin((t / 17) * Math.PI * 2), y: 0.92 + 0.07 * sway * Math.cos((t / 23) * Math.PI * 2) };
      const d2 = { x: 0.3 + 0.12 * sway * Math.cos((t / 21) * Math.PI * 2), y: 0.86 + 0.07 * sway * Math.sin((t / 19) * Math.PI * 2) };

      activeMix += ((pointer.active ? 1 : 0) - activeMix) * (1 - Math.pow(0.97, dt / 16.67));
      const tx = d1.x + (pointer.x + 0.04 * Math.sin(t / 3) - d1.x) * activeMix;
      const ty = d1.y + (pointer.y + 0.03 * Math.cos(t / 4) - d1.y) * activeMix;
      const sx = d2.x + (pointer.x - 0.12 - d2.x) * activeMix * 0.8;
      const sy = d2.y + (pointer.y + 0.1 - d2.y) * activeMix * 0.8;
      main.x += (tx - main.x) * k;
      main.y += (ty - main.y) * k;
      second.x += (sx - second.x) * k2;
      second.y += (sy - second.y) * k2;

      place(mainEl, sizes.main, main.x, main.y);
      if (!lean) {
        place(secondEl, sizes.second, second.x, second.y);
        place(topEl, sizes.top, 0.95, 0.28 + 0.05 * sway * Math.sin((t / 25) * Math.PI * 2));
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const renderStatic = () => {
      place(mainEl, sizes.main, main.x, main.y);
      place(secondEl, sizes.second, second.x, second.y);
      place(topEl, sizes.top, 0.95, 0.28);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX / vw;
      pointer.y = e.clientY / vh;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onResize = () => {
      measure();
      if (reduced) renderStatic();
    };

    if (reduced) renderStatic();
    else start();

    // Fondu d'apparition d'environ 600 ms.
    const fade = requestAnimationFrame(() => {
      wrap.style.opacity = "1";
    });

    if (fine && !reduced) window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      cancelAnimationFrame(fade);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hidden, followSpeed, palette]);

  if (hidden) return null;
  const cap = ALPHA_CAP * Math.max(0, Math.min(1, intensity));
  const layer = "absolute left-0 top-0 rounded-full will-change-transform";
  return (
    <div
      ref={wrapRef}
      aria-hidden
      data-animated-background
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background opacity-0 transition-opacity duration-[600ms] ease-out motion-reduce:transition-none"
    >
      <div ref={topRef} className={layer} style={{ backgroundImage: glowImage(cap * 0.28, palette) }} />
      <div ref={secondRef} className={layer} style={{ backgroundImage: glowImage(cap * 0.48, palette) }} />
      <div ref={mainRef} className={layer} style={{ backgroundImage: glowImage(cap * 0.78, palette) }} />
      {grain && <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: GRAIN, backgroundSize: "240px 240px" }} />}
    </div>
  );
}
