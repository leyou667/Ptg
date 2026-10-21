import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { contact, site } from "@/content/fr";
import { whatsappLink } from "@/lib/config";

export const metadata: Metadata = { title: "Contact", description: contact.meta, alternates: { canonical: "/contact" } };

export default function Page() {
  return (
    <>
      <PageHero h1={contact.h1} intro={contact.intro}>
        <Link href="/devis" className="btn btn-primary">
          {contact.quote}
        </Link>
      </PageHero>
      <section className="section section-alt">
        <div className="container-x grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-2xl">{contact.phone}</h2>
            <a href={site.phoneHref} className="mt-3 inline-flex min-h-11 items-center text-xl font-semibold underline decoration-cyan decoration-2 underline-offset-4">
              {site.phoneDisplay}
            </a>
          </div>
          <div>
            <h2 className="text-2xl">{contact.whatsapp}</h2>
            <a href={whatsappLink(site.whatsappGreeting)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-xl font-semibold underline decoration-cyan decoration-2 underline-offset-4">
              {site.whatsappLabel}
            </a>
          </div>
          <div>
            <h2 className="text-2xl">{contact.zone}</h2>
            <p className="mt-3">{contact.zoneText}</p>
          </div>
        </div>
      </section>
    </>
  );
}
