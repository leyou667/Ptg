import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { CookieBanner } from "@/components/CookieBanner";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SmoothScroll } from "@/components/SmoothScroll";

/** Le site public : en-tête, pied de page, bouton WhatsApp, bandeau cookies. L'administration n'en a aucun. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Avant le premier affichage : un visiteur qui a déjà choisi ne voit jamais la barre (pas de décalage de page). */}
      <script dangerouslySetInnerHTML={{ __html: 'try{if(localStorage.getItem("cheyclean-cookies"))document.documentElement.setAttribute("data-cookies","set")}catch(e){}' }} />
      <CookieBanner />
      <div id="top" />
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Header />
      <ScrollProgress />
      <SmoothScroll />
      <main>{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
