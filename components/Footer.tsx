import Link from "next/link";
import { cities, footer, nav, site } from "@/content/fr";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";

/** Un vrai pied de page : le nom ouvre, les lieux et les contacts suivent. */
export function Footer() {
  return (
    <footer data-chapter="light" className="field-brume pb-28 pt-20 md:pb-10 md:pt-28">
      <div className="container-x">
        <Reveal>
          <Logo className="h-auto w-[min(100%,34rem)]" />
        </Reveal>

        <div className="grid12 mt-16 gap-y-12">
          <Reveal delay={80} className="col-span-12 md:col-span-6">
            <p className="font-semibold tracking-tight" style={{ fontSize: "1.5rem" }}>
              Partout en Belgique
            </p>
            <ul className="mt-4 grid">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/nettoyage/${c.slug}`} className="big-link py-1 text-[2rem] font-semibold leading-tight tracking-tight md:text-[2.5rem]">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={160} className="col-span-12 md:col-span-5 md:col-start-8">
            <a href={site.phoneHref} className="big-link text-[2rem] font-semibold leading-tight tracking-tight md:text-[2.5rem]">
              {site.phoneDisplay}
            </a>
            <p className="soft mt-3">{site.tagline}</p>
            <div className="mt-10 grid grid-cols-2 gap-x-6">
              <FooterList title="Navigation" items={nav} />
              <FooterList title="Informations" items={footer.legal} />
            </div>
          </Reveal>
        </div>

        <div className="small mt-20 flex flex-wrap items-center justify-between gap-4">
          <p className="soft">
            © {new Date().getFullYear()} {footer.rights}
          </p>
          <a href="#top" className="inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4">
            Retour en haut
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="small font-semibold">{title}</p>
      <ul className="mt-2 grid">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="small inline-flex min-h-11 items-center transition-opacity hover:opacity-60">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
