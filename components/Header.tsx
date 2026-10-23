"use client";

import Link from "next/link";
import { useState } from "react";
import { headerUi, nav } from "@/content/fr";
import { Logo } from "./Logo";

/** Barre simple : le nom, quelques liens, une action. Un seul style sur toute la page : verre sombre. */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 bg-background/85 text-foreground">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="CheyClean, accueil" className="inline-flex min-h-11 shrink-0 items-center" onClick={() => setOpen(false)}>
          <Logo dark className="h-9 w-auto" />
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
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/devis" aria-label={headerUi.quickCtaAria} className="btn btn-primary min-h-11 px-5 py-2 text-[0.9375rem]">
            {headerUi.quickCta}
          </Link>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card"
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
