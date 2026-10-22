import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "./LogoutButton";

const nav = [
  { href: "/admin", label: "Demandes" },
  { href: "/admin/prestations", label: "Prestations et tarifs" },
  { href: "/admin/entreprise", label: "Entreprise" },
];

/** Espace interne : volontairement sans pied de page, sans bouton WhatsApp ni bandeau cookies. */
export function AdminShell({ children, active, csrf }: { children: React.ReactNode; active: string; csrf: string }) {
  return (
    <div className="min-h-svh bg-ground">
      <header className="on-dark bg-ink text-white">
        <div className="container-x flex min-h-16 flex-wrap items-center gap-x-8 gap-y-2 py-2">
          <Link href="/admin" aria-label="Administration CheyClean" className="flex shrink-0 items-center gap-3">
            <Logo dark className="h-8 w-auto" />
            <span className="small font-semibold text-white/80">Administration</span>
          </Link>
          <nav aria-label="Administration" className="flex flex-1 flex-wrap gap-1">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active === n.href ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-full px-4 font-medium transition-colors ${active === n.href ? "bg-white/15" : "hover:bg-white/10"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <LogoutButton csrf={csrf} />
        </div>
      </header>
      <main className="container-x py-10 md:py-14">{children}</main>
    </div>
  );
}
