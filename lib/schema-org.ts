import { cities, formulas, site } from "@/content/fr";
import { siteUrl } from "./config";

export const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#entreprise`,
  name: site.name,
  url: siteUrl,
  description: site.description,
  telephone: "+32486374548",
  image: `${siteUrl}/images/logo.png`,
  logo: `${siteUrl}/images/logo.png`,
  areaServed: [{ "@type": "Country", name: "Belgique" }, ...cities.map((c) => ({ "@type": "City", name: c.name }))],
  makesOffer: [...formulas.particulier, ...formulas.societe].map((f) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: `Formule ${f.name}`, description: f.tagline },
  })),
};

export function serviceSchema(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${siteUrl}${url}`,
    provider: { "@id": `${siteUrl}/#entreprise` },
    areaServed: { "@type": "Country", name: "Belgique" },
    availability: "https://schema.org/InStock",
    offers: { "@type": "Offer", availability: "https://schema.org/InStock" },
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}
