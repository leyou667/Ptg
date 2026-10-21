import Link from "next/link";
import { cities, footer, nav, site } from "@/content/fr";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="on-dark bg-marine text-white">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo dark className="h-14 w-auto" />
          <p className="mt-5 max-w-[32ch] text-white/80">{site.tagline}</p>
          <a href={site.phoneHref} className="mt-5 inline-flex min-h-11 items-center font-semibold underline decoration-cyan decoration-2 underline-offset-4">
            {site.phoneDisplay}
          </a>
        </div>
        <FooterList title="Navigation" items={nav} />
        <FooterList title={footer.cities} items={cities.map((c) => ({ href: `/nettoyage/${c.slug}`, label: c.name }))} />
        <FooterList title="Informations" items={footer.legal} />
      </div>
      <div className="border-t border-white/15">
        <p className="container-x py-5 text-sm text-white/70">© {new Date().getFullYear()} {footer.rights}</p>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="font-semibold">{title}</p>
      <ul className="mt-3 grid">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="inline-flex min-h-11 items-center text-white/80 hover:text-white">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
