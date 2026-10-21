import { site } from "@/content/fr";
import { whatsappLink } from "@/lib/config";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink(site.whatsappGreeting)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-marine px-5 py-3 font-semibold text-white shadow-marine transition-colors hover:bg-[#17325f] md:bottom-6 md:left-6"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-cyan">
        <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9.5L4 22v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      </svg>
      <span>{site.whatsappLabel}</span>
    </a>
  );
}
