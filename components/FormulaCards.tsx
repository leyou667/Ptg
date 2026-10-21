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
};

/**
 * Trois formules, pas trois cartes identiques : la recommandée est plus grande et en marine,
 * et les lignes comparables sont alignées d'une formule à l'autre (sous-grille).
 */
export function FormulaCards({ items, profile, selected, onChoose }: Props) {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-[1fr_1.12fr_1fr] md:gap-x-6 md:gap-y-0">
      {items.map((f) => {
        const rec = !!f.recommended;
        const isSel = selected === f.id;
        return (
          <article
            key={f.id}
            aria-label={`Formule ${f.name}`}
            className={`grid gap-0 rounded-[20px] p-6 md:row-span-5 md:grid-rows-subgrid md:p-8 ${
              rec ? "on-dark bg-marine text-white shadow-marine md:-my-5 md:py-12" : "border border-ligne bg-white"
            } ${isSel ? "ring-4 ring-cyan" : ""}`}
          >
            <header className="pb-5">
              {rec && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan px-3 py-1 text-sm font-semibold text-marine">
                  <Star className="h-3.5 w-3.5" />
                  {quote.formulas.recommended}
                </p>
              )}
              <h3 className={rec ? "text-3xl" : "text-2xl"}>{f.name}</h3>
              <p className={`mt-2 ${rec ? "text-white/85" : "text-marine-soft"}`}>{f.tagline}</p>
            </header>
            {f.rows.map((r) => (
              <div key={r.label} className={`border-t py-4 ${rec ? "border-white/20" : "border-ligne"}`}>
                <p className={`text-sm font-semibold ${rec ? "text-cyan" : "text-marine-soft"}`}>{r.label}</p>
                <p className="mt-1">{r.value}</p>
              </div>
            ))}
            <div className="pt-6">
              {onChoose ? (
                <button
                  type="button"
                  className={`btn w-full ${rec ? "btn-cyan" : "btn-ghost"}`}
                  aria-pressed={isSel}
                  onClick={() => onChoose(f.id)}
                >
                  {isSel ? quote.formulas.chosen : quote.formulas.choose}
                </button>
              ) : (
                <Link href={`/devis?profil=${profile}&formule=${f.id}`} className={`btn w-full ${rec ? "btn-cyan" : "btn-ghost"}`}>
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
