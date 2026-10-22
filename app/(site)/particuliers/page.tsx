import type { Metadata } from "next";
import { AudiencePage } from "@/components/AudiencePage";
import { audiencePages } from "@/content/fr";

export const metadata: Metadata = {
  title: "Nettoyage à domicile en abonnement",
  description: audiencePages.particulier.meta,
  alternates: { canonical: "/particuliers" },
};

export default function Page() {
  return <AudiencePage profile="particulier" />;
}
