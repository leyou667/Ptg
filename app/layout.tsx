import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AnimatedBackground } from "@/components/ui/animated-background";
import "./globals.css";
import { site } from "@/content/fr";
import { siteUrl } from "@/lib/config";

const display = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap" });
const sans = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

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

export const viewport: Viewport = { themeColor: "#02060f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-BE" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
