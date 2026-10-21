import type { MetadataRoute } from "next";
import { cities } from "@/content/fr";
import { siteUrl } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/particuliers", "/societes", "/devis", "/a-propos", "/contact", "/mentions-legales", "/confidentialite", "/cookies"];
  return [...pages, ...cities.map((c) => `/nettoyage/${c.slug}`)].map((p) => ({
    url: `${siteUrl}${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : p === "/devis" ? 0.9 : 0.6,
  }));
}
