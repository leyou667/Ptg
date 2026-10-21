"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { intro } from "@/content/fr";
import { Star } from "./Star";

const DURATION = 10;
const SEGMENT = DURATION / intro.lines.length; // 2 s par phrase

type Connection = { saveData?: boolean; effectiveType?: string };

export function Intro() {
  const wrap = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const lines = useRef<(HTMLLIElement | null)[]>([]);
  const starEl = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrap.current;
    const vid = video.current;
    if (!root || !vid) return;

    const conn = (navigator as Navigator & { connection?: Connection }).connection;
    const slow = conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g" || conn?.effectiveType === "3g";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || slow) {
      root.classList.add("intro-static");
      return;
    }

    let target = 0;
    let current = 0;
    let raf = 0;
    let killed = false;
    let cleanup = () => {};

    const draw = (p: number) => {
      const t = p * DURATION;
      lines.current.forEach((el, i) => {
        if (!el) return;
        const local = (t - i * SEGMENT) / SEGMENT; // 0..1 dans la fenêtre de la phrase
        const last = i === intro.lines.length - 1;
        let o = 0;
        let y = 14;
        if (local >= 0 && local <= 1) {
          const fadeIn = i === 0 ? 1 : Math.min(1, local / 0.3);
          const fadeOut = last ? 1 : Math.min(1, (1 - local) / 0.25);
          o = Math.min(fadeIn, fadeOut);
          y = (1 - fadeIn) * 14;
        } else if (last && local > 1) {
          o = 1;
          y = 0;
        }
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${y}px, 0)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });
      if (starEl.current) {
        const s = (t - SEGMENT) / SEGMENT;
        starEl.current.style.opacity = s > 0.05 && s < 0.95 ? String(Math.min(1, s * 5, (1 - s) * 5)) : "0";
      }
      if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 14));
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0004) current = target;
      draw(current);
      const time = current * DURATION;
      if (vid.readyState >= 2 && Math.abs(vid.currentTime - time) > 1 / 60 && !vid.seeking) {
        vid.currentTime = Math.min(DURATION - 0.01, Math.max(0, time));
      }
    };

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          target = self.progress;
        },
      });
      vid.pause();
      draw(0);
      raf = requestAnimationFrame(loop);
      cleanup = () => st.kill();
    })();

    return () => {
      killed = true;
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  const skip = () => {
    const el = document.getElementById("contenu");
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { immediate: true });
    else el.scrollIntoView();
  };

  return (
    <section ref={wrap} aria-label="Introduction" className="intro relative -mt-16">
      <div className="intro-stage sticky top-0 h-svh w-full overflow-hidden bg-marine">
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          poster="/images/intro-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-label={intro.posterAlt}
        >
          <source src="/videos/intro.mp4" type="video/mp4" />
          <source src="/videos/intro.webm" type="video/webm" />
        </video>
        {/* Voile sable puis marine : lisibilité du texte en bas à gauche */}
        <div aria-hidden className="absolute inset-0 bg-sable/25 mix-blend-multiply" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-marine/85 via-marine/35 to-transparent" />

        <div ref={starEl} aria-hidden className="absolute left-[48%] top-[60%] h-16 w-16 opacity-0 md:left-[56%] md:top-[64%] md:h-24 md:w-24">
          <Star className="scintille h-full w-full text-cyan drop-shadow-[0_0_0_rgba(0,0,0,0)]" />
        </div>

        <div className="container-x intro-copy absolute inset-x-0 bottom-0 pb-24 md:pb-20">
          <ol className="relative min-h-[9.5rem] md:min-h-[11rem]">
            {intro.lines.map((text, i) => {
              const last = i === intro.lines.length - 1;
              return (
                <li
                  key={text}
                  ref={(el) => {
                    lines.current[i] = el;
                  }}
                  className="intro-line absolute inset-x-0 bottom-0 max-w-[16ch] text-[2.1rem] font-semibold leading-[1.05] tracking-tight text-white sm:max-w-[22ch] sm:text-5xl md:max-w-[26ch] md:text-6xl"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  {text}
                  {last && (
                    <span className="mt-6 block">
                      <Link href="/devis" className="btn btn-cyan text-base">
                        {intro.cta}
                      </Link>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div ref={hint} className="intro-hint absolute left-5 top-[5.5rem] text-sm font-medium text-white/90 md:left-auto md:right-16" aria-hidden>
          {intro.scrollHint}
        </div>
        <button type="button" onClick={skip} className="intro-skip btn absolute right-10 top-[5.5rem] min-h-11 border-white/60 bg-marine/40 px-5 py-2 text-sm text-white backdrop-blur hover:bg-white hover:text-marine md:bottom-8 md:right-16 md:top-auto">
          {intro.skip}
        </button>
      </div>
    </section>
  );
}
