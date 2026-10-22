import Link from "next/link";
import { choice } from "@/content/questionnaire";

/**
 * Les deux grands choix. Chaque tuile ouvre directement le questionnaire correspondant :
 * il n'y a aucune page intermédiaire entre le choix et la première question.
 */
export function ChoiceTiles({ onDark = false, className = "", animate = false }: { onDark?: boolean; className?: string; animate?: boolean }) {
  const tile = "choice group flex min-h-[7.5rem] flex-col justify-between gap-6 bg-ground p-6 text-ink transition-colors duration-200 hover:bg-cyan focus-visible:bg-cyan md:min-h-[13rem] md:p-9";
  return (
    <div className={`grid gap-3 md:grid-cols-2 md:gap-5 ${className}`} data-ondark={onDark || undefined}>
      <Link href="/devis/particulier" aria-label={choice.particulier.aria} className={`${tile} ${animate ? "rise" : ""}`} style={animate ? ({ "--d": "180ms" } as React.CSSProperties) : undefined}>
        <span className="font-bold leading-none tracking-tight" style={{ fontSize: "clamp(2rem, 5.2vw, 4.75rem)", letterSpacing: "-0.04em" }}>
          {choice.particulier.word}
        </span>
        <span className="text-[1.125rem] md:text-[1.25rem]">{choice.particulier.text}</span>
      </Link>
      <Link href="/devis/societe" aria-label={choice.societe.aria} className={`${tile} ${animate ? "rise" : ""}`} style={animate ? ({ "--d": "280ms" } as React.CSSProperties) : undefined}>
        <span className="font-bold leading-none tracking-tight" style={{ fontSize: "clamp(2rem, 5.2vw, 4.75rem)", letterSpacing: "-0.04em" }}>
          {choice.societe.word}
        </span>
        <span className="text-[1.125rem] md:text-[1.25rem]">{choice.societe.text}</span>
      </Link>
    </div>
  );
}
