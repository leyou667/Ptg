import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { legal } from "@/content/fr";

export const metadata: Metadata = { title: legal.cookies.h1, description: legal.cookies.meta, alternates: { canonical: "/cookies" } };

export default function Page() {
  return <LegalPage h1={legal.cookies.h1} sections={legal.cookies.sections} />;
}
