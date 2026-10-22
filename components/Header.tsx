"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { nav } from "@/content/fr";
import { Logo } from "./Logo";

/** Barre simple : le nom, quelques liens, une action. Elle prend l'encre du chapitre qui passe dessous. */
export function Header() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const hit = document
        .elementsFromPoint(window.innerWidth / 2, 40)
        .find((e) => !e.closest("header") && e.closest("[data-chapter]"));
      const tone = hit?.closest<HTMLElement>("[data-chapter]")?.dataset.chapter;
      setDark(tone === "dark");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const bar = dark || open ? (open && !dark ? "bg-ground text-ink" : "bg-ink text-white") : "bg-ground text-ink";
  const tone = dark && !open ? "dark" : "light";

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${bar} ${tone === "dark" ? "on-dark" : ""}`}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="CheyClean, accueil" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo dark={tone === "dark"} className="h-9 w-auto" />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-2 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center px-4 font-medium transition-opacity hover:opacity-65">
              {n.label}
            </Link>
          ))}
          <Link href="/devis" className="btn btn-cyan ml-2 min-h-11 py-2">
            Demander mon devis
          </Link>
        </nav>
        <button
          type="button"
          className={`flex h-11 w-11 items-center justify-center rounded-full md:hidden ${tone === "dark" ? "bg-white/15" : "bg-stone"}`}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="relative block h-3 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-current transition-transform duration-300 ${open ? "top-1/2 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1/2 h-0.5 w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-current transition-transform duration-300 ${open ? "top-1/2 -rotate-45" : "bottom-0"}`} />
          </span>
        </button>
      </div>
      {open && (
        <nav id="menu-mobile" aria-label="Navigation mobile" className="md:hidden">
          <ul className="container-x grid gap-1 pb-6 pt-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="flex min-h-14 items-center text-3xl font-semibold tracking-tight">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link href="/devis" onClick={() => setOpen(false)} className="btn btn-cyan w-full">
                Demander mon devis
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
