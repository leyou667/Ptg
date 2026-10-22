import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/content/fr";
import { siteUrl } from "@/lib/config";

const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-face",
  display: "swap",
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name}, société de nettoyage en Belgique`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "fr_BE",
    siteName: site.name,
    title: `${site.name}, société de nettoyage en Belgique`,
    description: site.description,
    images: [{ url: "/images/og.png", width: 1200, height: 630, alt: "CheyClean" }],
  },
  twitter: { card: "summary_large_image", images: ["/images/og.png"] },
  alternates: { canonical: "./" },
};

export const viewport: Viewport = { themeColor: "#f7f7f5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-BE" className={sans.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
