import Link from "next/link";
import type { Formula, FormulaId, Profile } from "@/content/fr";
import { quote } from "@/content/fr";
import { Star } from "./Star";

type Props = {
  items: Formula[];
  profile: Profile;
  selected?: FormulaId | null;
  /** Mode parcours : bouton qui appelle onChoose. Sinon lien vers /devis. */
  onChoose?: (id: FormulaId) => void;
  /** Sur fond brume, les formules sobres passent en papier pour garder un pas de tonalité. */
  tone?: "papier" | "brume";
};

/**
 * Trois formules, pas trois cartes identiques : la recommandée est plus grande, en marine ; les deux autres
 * sont plates, d'un pas de tonalité. Les lignes comparables sont alignées d'une formule à l'autre (sous-grille).
 */
export function FormulaCards({ items, profile, selected, onChoose, tone = "brume" }: Props) {
  const plain = tone === "brume" ? "bg-brume" : "bg-white";
  return (
    <div className="grid items-stretch gap-10 md:grid-cols-[1fr_1.14fr_1fr] md:gap-x-5 md:gap-y-0">
      {items.map((f) => {
        const rec = !!f.recommended;
        const isSel = selected === f.id;
        return (
          <article
            key={f.id}
            aria-label={`Formule ${f.name}`}
            className={`grid gap-0 p-6 md:row-span-5 md:grid-rows-subgrid md:p-9 ${
              rec ? "on-dark bg-marine text-white md:-my-6 md:py-14" : plain
            } ${isSel ? "outline outline-4 outline-offset-[-4px] outline-cyan" : ""}`}
          >
            <header className="pb-6">
              <h3 className={`flex items-center gap-3 ${rec ? "text-[2.25rem]" : "text-[1.75rem]"}`}>
                {f.name}
                {rec && <Star className="h-5 w-5 text-cyan" />}
              </h3>
              {rec && <p className="mt-2 font-semibold text-cyan">{quote.formulas.recommended}</p>}
              <p className={`mt-3 ${rec ? "text-white/85" : "soft"}`}>{f.tagline}</p>
            </header>
            {f.rows.map((r) => (
              <div key={r.label} className="py-4">
                <p className={`small font-semibold ${rec ? "text-cyan" : "soft"}`}>{r.label}</p>
                <p className="mt-1">{r.value}</p>
              </div>
            ))}
            <div className="pt-6">
              {onChoose ? (
                <button type="button" className={`btn w-full ${rec ? "btn-cyan" : "btn-primary"}`} aria-pressed={isSel} onClick={() => onChoose(f.id)}>
                  {isSel ? quote.formulas.chosen : quote.formulas.choose}
                </button>
              ) : (
                <Link href={`/devis?profil=${profile}&formule=${f.id}`} className={`btn w-full ${rec ? "btn-cyan" : "btn-primary"}`}>
                  {quote.formulas.choose}
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
