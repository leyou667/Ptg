"use client";

import Link from "next/link";
import { useState } from "react";
import { nav } from "@/content/fr";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-ligne/70 bg-papier/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="CheyClean, accueil" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo className="h-9 w-auto" />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2.5 font-medium hover:bg-brume">
              {n.label}
            </Link>
          ))}
          <Link href="/devis" className="btn btn-primary ml-3 min-h-11 py-2">
            Demander mon devis
          </Link>
        </nav>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ligne md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden className="relative block h-3 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-marine transition-all ${open ? "top-1/2 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1/2 h-0.5 w-5 bg-marine transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-marine transition-all ${open ? "top-1/2 -rotate-45" : "bottom-0"}`} />
          </span>
        </button>
      </div>
      {open && (
        <nav id="menu-mobile" aria-label="Navigation mobile" className="border-t border-ligne bg-papier md:hidden">
          <ul className="container-x grid gap-1 py-4">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-lg font-medium hover:bg-brume">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/devis" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Demander mon devis
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
