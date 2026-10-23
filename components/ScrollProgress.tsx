"use client";

import { useEffect, useRef } from "react";
import { Star } from "./Star";

/** L'étoile du logo descend le long d'un fin trait vertical au fil du défilement. */
export function ScrollProgress() {
  const star = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (star.current) star.current.style.transform = `translate3d(0, calc(${p} * (100vh - 10rem - 100%)), 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed right-0.5 top-16 bottom-24 z-30 w-4 md:w-5">
      <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-primary/30" />
      <div ref={star} className="absolute left-0 top-0 w-4 will-change-transform md:w-5">
        <Star className="h-4 w-4 text-primary md:h-5 md:w-5" />
      </div>
    </div>
  );
}
