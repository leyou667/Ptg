"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __lenis?: import("lenis").default;
  }
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let cancelled = false;
    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.1, anchors: true, syncTouch: false });
      window.__lenis = lenis;
      const loop = (t: number) => {
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      (window as unknown as { __stopLenis: () => void }).__stopLenis = () => {
        cancelAnimationFrame(raf);
        lenis.destroy();
        window.__lenis = undefined;
      };
    })();
    return () => {
      cancelled = true;
      (window as unknown as { __stopLenis?: () => void }).__stopLenis?.();
    };
  }, []);
  return null;
}
