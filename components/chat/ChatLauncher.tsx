"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { assistantUi } from "@/content/fr";

const QuoteAssistant = dynamic(() => import("./quote-assistant").then((m) => m.QuoteAssistant), { ssr: false });

/**
 * La bulle en bas à droite (l'ancien bouton WhatsApp) ouvre maintenant l'assistant de devis.
 * Le lien WhatsApp reste toujours visible dans le panneau. Le panneau n'est chargé qu'à la première ouverture.
 */
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const bubble = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={bubble}
        type="button"
        aria-label={assistantUi.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={assistantUi.open}
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-flotte transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary/85 md:bottom-6 md:right-6"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-primary-foreground">
          <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9.5L4 22v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        </svg>
      </button>
      {open && (
        <QuoteAssistant
          onClose={() => {
            setOpen(false);
            // Le focus revient sur la bulle qui a ouvert le panneau.
            requestAnimationFrame(() => bubble.current?.focus());
          }}
        />
      )}
    </>
  );
}
