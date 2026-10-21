import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legal } from "@/content/fr";

export const metadata: Metadata = { title: legal.privacy.h1, description: legal.privacy.meta, alternates: { canonical: "/confidentialite" } };

export default function Page() {
  return <LegalPage h1={legal.privacy.h1} sections={legal.privacy.sections} />;
}
