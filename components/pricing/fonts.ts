import { Fraunces, Inter } from "next/font/google";

/** Polices de la section des formules, chargées seulement sur les pages qui l'utilisent. */
export const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap" });
export const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
