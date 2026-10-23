"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { home, intro } from "@/content/fr";
import { choice } from "@/content/questionnaire";
import { ChoiceTiles } from "./ChoiceTiles";
import { Star } from "./Star";

// Quatre phrases, puis les deux grands choix. Progression du défilement (0 à 1) :
//   0 à 0,62 : les phrases ; 0,62 à 0,7 : respiration ; 0,7 à 0,82 : les choix apparaissent ; ensuite ils restent.
const PHRASES = intro.lines.slice(0, 4);
const SEGMENT = 0.62 / PHRASES.length;
const CHOICES_FROM = 0.7;
const CHOICES_FULL = 0.82;
const FRAMES_END = 0.7; // la séquence d'images est finie quand les choix arrivent

// Séquences d'images extraites de la vidéo (scripts/make-frames.sh).
const SETS = {
  desktop: { dir: "/frames/desktop", count: 240 }, // 24 images/s
  mobile: { dir: "/frames/mobile", count: 120 }, // 12 images/s
};
const frameUrl = (dir: string, i: number) => `${dir}/frame_${String(i + 1).padStart(3, "0")}.webp`;

type Connection = { saveData?: boolean; effectiveType?: string };

export function Intro() {
  const wrap = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lines = useRef<(HTMLLIElement | null)[]>([]);
  const starEl = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const subs = useRef<(HTMLDivElement | null)[]>([]);
  const choicesEl = useRef<HTMLDivElement>(null);
  const skipEl = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = wrap.current;
    const stageEl = stage.current;
    const cv = canvas.current;
    if (!root || !stageEl || !cv) return;

    const goStatic = () => root.classList.add("intro-static");

    const conn = (navigator as Navigator & { connection?: Connection }).connection;
    // « 3g » n'est pas retenu : Chrome de bureau l'annonce dès que la latence est élevée (Wi-Fi chargé, VPN) alors que les 5,6 Mo d'images passent sans problème.
    const slow = conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || slow) return goStatic();

    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return goStatic();
    ctx.imageSmoothingQuality = "high";

    const set = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches ? SETS.mobile : SETS.desktop;
    const images: (HTMLImageElement | undefined)[] = new Array(set.count);

    let target = 0;
    let current = 0;
    let raf = 0;
    let lastDrawn = -1;
    let killed = false;
    let refresh = () => {};
    let cleanup = () => {};

    /* ---- Dessin : toujours dans requestAnimationFrame, jamais dans l'événement scroll ---- */
    const nearest = (i: number) => {
      for (let d = 0; d < set.count; d++) {
        if (images[i - d]) return i - d;
        if (images[i + d]) return i + d;
      }
      return -1;
    };

    const drawFrame = (index: number) => {
      const k = nearest(index);
      const img = k >= 0 ? images[k] : undefined;
      if (!img) return false;
      const cw = cv.width;
      const ch = cv.height;
      // object-fit: cover simulé
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      return true;
    };

    const drawText = (p: number) => {
      lines.current.forEach((el, i) => {
        if (!el) return;
        const local = (p - i * SEGMENT) / SEGMENT; // 0..1 dans la fenêtre de la phrase
        let o = 0;
        let y = 14;
        if (local >= 0 && local <= 1) {
          const fadeIn = i === 0 ? 1 : Math.min(1, local / 0.3);
          const fadeOut = Math.min(1, (1 - local) / 0.25);
          o = Math.min(fadeIn, fadeOut);
          y = (1 - fadeIn) * 14;
        }
        // La première phrase est le <h1> : l'opacité va sur le titre lui-même, pas sur son <li>.
        const node = (i === 0 ? el.firstElementChild : el) as HTMLElement;
        node.style.opacity = String(o);
        node.style.transform = `translate3d(0, ${y}px, 0)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
        // Les phrases à zéro sortent de l'arbre de rendu (le texte complet reste dans .intro-srlist).
        if (i > 0) el.style.visibility = o > 0.02 ? "visible" : "hidden";
      });
      // Énoncé et bouton : suivent la première phrase.
      const o0 = Number((lines.current[0]?.firstElementChild as HTMLElement | undefined)?.style.opacity || 0);
      const sub = subs.current[0];
      if (sub) {
        sub.style.opacity = String(o0);
        sub.style.visibility = o0 > 0.02 ? "visible" : "hidden";
        sub.style.pointerEvents = o0 > 0.5 ? "auto" : "none";
      }
      // Les deux grands choix.
      const c = Math.min(1, Math.max(0, (p - CHOICES_FROM) / (CHOICES_FULL - CHOICES_FROM)));
      const ch = choicesEl.current;
      if (ch) {
        ch.style.opacity = String(c);
        ch.style.transform = `translate3d(0, ${(1 - c) * 24}px, 0)`;
        ch.style.visibility = c > 0.02 ? "visible" : "hidden";
        ch.style.pointerEvents = c > 0.5 ? "auto" : "none";
      }
      if (starEl.current) {
        const s = (p - SEGMENT) / SEGMENT;
        starEl.current.style.opacity = s > 0.05 && s < 0.95 ? String(Math.min(1, s * 5, (1 - s) * 5)) : "0";
      }
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 14));
      if (skipEl.current) {
        skipEl.current.style.opacity = String(1 - c);
        skipEl.current.style.visibility = c > 0.9 ? "hidden" : "visible";
      }
    };

    const tick = () => {
      raf = 0;
      current += (target - current) * 0.2;
      if (Math.abs(target - current) < 0.0003) current = target;
      drawText(target); // le texte suit exactement le défilement ; seule l'image est lissée
      const idx = Math.round(Math.min(1, current / FRAMES_END) * (set.count - 1));
      if (idx !== lastDrawn && drawFrame(idx)) lastDrawn = idx;
      if (current !== target) request();
    };
    const request = () => {
      if (!raf && !killed) raf = requestAnimationFrame(tick);
    };

    /* ---- Taille du canvas (devicePixelRatio plafonné à 2 pour ménager la mémoire) ---- */
    const resize = () => {
      const r = stageEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        ctx.imageSmoothingQuality = "high";
        lastDrawn = -1;
      }
      request();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stageEl);
    resize();

    /* ---- Chargement progressif : 1re image, puis paquets (grosses mailles d'abord) ---- */
    const load = (i: number) =>
      new Promise<boolean>((resolve) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => {
          const done = () => {
            images[i] = im;
            resolve(true);
          };
          // Décode avant de dessiner pour éviter un à-coup au premier affichage.
          (im.decode ? im.decode() : Promise.resolve()).then(done, done);
        };
        im.onerror = () => resolve(false);
        im.src = frameUrl(set.dir, i);
      });

    const loadBatch = async (indices: number[]) => {
      const CONCURRENCY = 6;
      let cursor = 0;
      const worker = async () => {
        while (cursor < indices.length && !killed) await load(indices[cursor++]);
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, indices.length) }, worker));
    };

    const loadRest = async () => {
      for (const stride of [24, 8, 4, 2, 1]) {
        if (killed) return;
        const todo: number[] = [];
        for (let i = 0; i < set.count; i += stride) if (!images[i]) todo.push(i);
        if (todo.length) {
          await loadBatch(todo);
          lastDrawn = -1; // une image plus proche est peut-être disponible
          request();
        }
      }
      refresh();
    };

    (async () => {
      // 1. Seulement la première image : le reste ne bloque ni l'affichage ni le défilement.
      if (!(await load(0)) || killed) {
        if (!killed) goStatic();
        return;
      }
      lastDrawn = -1;
      request();

      // 2. Défilement : GSAP ScrollTrigger (chargé à la demande).
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);
      // iOS Safari : la barre d'adresse qui se replie ne doit pas déclencher de recalcul.
      ScrollTrigger.config({ ignoreMobileResize: true });
      const st = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          target = self.progress;
          request();
        },
      });
      refresh = () => ScrollTrigger.refresh();
      cleanup = () => st.kill();
      drawText(0);

      // 3. Le reste des images, après le chargement de la page.
      const start = () => {
        if (!killed) void loadRest();
      };
      if (document.readyState === "complete") start();
      else {
        window.addEventListener("load", start, { once: true });
        const prev = cleanup;
        cleanup = () => {
          prev();
          window.removeEventListener("load", start);
        };
      }
      refresh();
    })();

    return () => {
      killed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      cleanup();
    };
  }, []);

  /** Saute l'animation : arrive directement sur l'écran des deux choix. */
  const skip = () => {
    const root = wrap.current;
    if (!root) return;
    const reduced = root.classList.contains("intro-static") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = reduced ? document.getElementById("choix") : null;
    const top = target ? target.getBoundingClientRect().top + window.scrollY - 80 : root.offsetTop + (root.offsetHeight - window.innerHeight) * 0.92;
    if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true });
    else window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
  };

  return (
    <section ref={wrap} aria-label="Introduction" className="intro relative -mt-16">
      <div ref={stage} className="intro-stage sticky top-0 h-svh w-full overflow-hidden bg-background">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" role="img" aria-label={intro.posterAlt} />
        {/* Voile sous le texte posé sur l'image */}
        <div aria-hidden className="absolute inset-0 bg-background/25" />
        {/* taste-skill-ignore : voile sous le texte posé sur l'image, seule exception admise aux dégradés */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" /> {/* taste-skill-ignore */}

        <div ref={starEl} aria-hidden className="absolute left-[48%] top-[60%] h-16 w-16 opacity-0 md:left-[56%] md:top-[64%] md:h-24 md:w-24">
          <Star className="scintille h-full w-full text-primary" />
        </div>

        <div className="container-x intro-copy absolute inset-x-0 bottom-0 pb-24 md:pb-16">
          <p className="intro-srlist sr-only">{intro.lines.slice(1, 4).join(" ")}</p>
          <ol className="relative min-h-[6.5rem] md:min-h-[9rem]">
            {PHRASES.map((text, i) => (
              <li
                key={text}
                ref={(el) => {
                  lines.current[i] = el;
                }}
                className="intro-line absolute inset-x-0 bottom-0 max-w-none text-[1.75rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:max-w-[22ch] sm:text-5xl md:max-w-[26ch] md:text-6xl"
                style={i === 0 ? undefined : { opacity: 0, visibility: "hidden" }}
              >
                {i === 0 ? (
                  <h1 style={{ fontSize: "inherit", lineHeight: "inherit", letterSpacing: "inherit", fontWeight: "inherit" }}>
                    {text}
                    <span className="sr-only"> CheyClean, société de nettoyage en Belgique.</span>
                  </h1>
                ) : (
                  text
                )}
              </li>
            ))}
          </ol>
          <div className="relative mt-5 min-h-[8.5rem]">
            <div ref={(el) => { subs.current[0] = el; }} className="intro-sub absolute inset-x-0 top-0">
              <p className="max-w-[30ch] text-xl leading-snug text-foreground/90">{home.statement}</p>
              <button type="button" onClick={skip} className="btn btn-cyan mt-5 text-base">
                {intro.cta}
              </button>
            </div>
          </div>
        </div>

        {/* L'interface principale : deux grands choix, qui ouvrent directement le questionnaire. */}
        <div
          id="choix"
          ref={choicesEl}
          className="intro-choices container-x absolute inset-x-0 bottom-0 pb-24"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <p className="text-[1.125rem] text-foreground/85 md:text-xl">{choice.tagline}</p>
          <h2 className="mt-2 text-foreground" style={{ fontSize: "clamp(1.75rem, 1rem + 2.6vw, 3.5rem)" }}>
            {choice.title}
          </h2>
          <ChoiceTiles className="mt-5 md:mt-7" />
        </div>

        <div ref={hint} className="intro-hint absolute left-5 top-[5.5rem] text-sm font-medium text-foreground/90 md:left-auto md:right-16" aria-hidden>
          {intro.scrollHint}
        </div>
        <button ref={skipEl} type="button" onClick={skip} className="intro-skip btn absolute right-10 top-[5.5rem] min-h-11 bg-background/60 px-5 py-2 text-[0.9375rem] text-foreground hover:bg-foreground hover:text-background md:bottom-8 md:right-16 md:top-auto">
          {intro.skip}
        </button>
      </div>
    </section>
  );
}
