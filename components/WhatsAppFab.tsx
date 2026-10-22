import { site } from "@/content/fr";
import { whatsappLink } from "@/lib/config";

/** Bouton flottant compact : un cercle, pour ne pas recouvrir le texte. Son nom reste lisible par les lecteurs d'écran. */
export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink(site.whatsappGreeting)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={site.whatsappLabel}
      title={site.whatsappLabel}
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-flotte transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#16474b] md:bottom-6 md:right-6"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-cyan">
        <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9.5L4 22v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      </svg>
    </a>
  );
}
