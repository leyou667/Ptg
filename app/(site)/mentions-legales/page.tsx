import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legal } from "@/content/fr";

export const metadata: Metadata = { title: legal.mentions.h1, description: legal.mentions.meta, alternates: { canonical: "/mentions-legales" } };

export default function Page() {
  return <LegalPage h1={legal.mentions.h1} intro="Qui édite ce site, et comment nous joindre." sections={legal.mentions.sections} />;
}
