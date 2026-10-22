import type { Metadata } from "next";
import { AudiencePage } from "@/components/AudiencePage";
import { audiencePages } from "@/content/fr";

export const metadata: Metadata = {
  title: "Nettoyage de bureaux et locaux professionnels",
  description: audiencePages.societe.meta,
  alternates: { canonical: "/societes" },
};

export default function Page() {
  return <AudiencePage profile="societe" />;
}
