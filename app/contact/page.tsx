import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { contact, site } from "@/content/fr";
import { whatsappLink } from "@/lib/config";

export const metadata: Metadata = { title: "Contact", description: contact.meta, alternates: { canonical: "/contact" } };

export default function Page() {
  const links = [
    { label: contact.phone, text: site.phoneDisplay, href: site.phoneHref },
    { label: contact.whatsapp, text: site.whatsappLabel, href: whatsappLink(site.whatsappGreeting), ext: true },
  ];
  return (
    <>
      <PageHero h1={contact.h1} intro={contact.intro} action={{ href: "/devis", label: contact.quote }} />
      <section data-chapter="light" className="field-brume section">
        <div className="container-x grid12 gap-y-12">
          <div className="col-span-12 grid gap-12 md:col-span-7">
            {links.map((l, i) => (
              <Reveal key={l.label} delay={i * 90}>
                <h2 className="text-[1.5rem]" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  {l.label}
                </h2>
                <a
                  href={l.href}
                  {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="big-link mt-2 font-bold tracking-tight"
                  style={{ fontSize: "clamp(2rem, 1rem + 3.6vw, 4.5rem)", lineHeight: 1, letterSpacing: "-0.038em" }}
                >
                  {l.text}
                </a>
              </Reveal>
            ))}
            <Reveal delay={180}>
              <h2 style={{ fontSize: "1.5rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{contact.zone}</h2>
              <p className="lead mt-2">{contact.zoneText}</p>
            </Reveal>
          </div>
          <Reveal delay={140} className="col-span-12 md:col-span-4 md:col-start-9">
            <Photo name="fenetre" ratio="4 / 5" position="50% 40%" />
          </Reveal>
        </div>
      </section>

      <section data-chapter="light" className="section">
        <div className="container-x">
          <Reveal>
            <h2 className="max-w-[16ch]">Des lieux entretenus avec soin</h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {(["arche", "escalier", "sol", "salon"] as const).map((n, i) => (
              <Reveal key={n} delay={i * 80}>
                <Photo name={n} ratio="4 / 5" sizes="(min-width: 768px) 25vw, 50vw" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
