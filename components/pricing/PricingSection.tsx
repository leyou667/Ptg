"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { pricingUi, type Profile } from "@/content/fr";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildPlans, type PricingPlan } from "./plans";

const heading = "font-display font-semibold";

function Items({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <span className="text-muted-foreground">{empty}</span>;
  return (
    <ul className="grid gap-2">
      {items.map((x) => (
        <li key={x} className="flex items-start gap-2.5">
          <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({ plan, profile, index }: { plan: PricingPlan; profile: Profile; index: number }) {
  const rec = plan.isRecommended;
  const profileName = pricingUi.profiles[profile];
  return (
    <Card
      tabIndex={0}
      data-plan-index={index}
      aria-label={`Formule ${plan.name}`}
      className={cn(
        // Mobile : carte de ~82 % de l'écran (340 px au plus), alignée au centre du carrousel. md et plus : colonne de la grille.
        "relative w-[82vw] max-w-[340px] shrink-0 snap-center outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:w-auto md:max-w-none md:shrink md:snap-align-none md:hover:-translate-y-1 md:motion-reduce:hover:translate-y-0",
        rec ? "border-primary ring-2 ring-primary md:z-10 md:scale-[1.05]" : "",
      )}
    >
      {rec && (
        <span className="absolute left-5 top-0 -translate-y-1/2 md:left-7 rounded-full bg-primary px-4 py-1 text-[14px] font-semibold text-primary-foreground">
          {pricingUi.recommended}
        </span>
      )}
      <CardHeader className="gap-1.5 px-5 pt-6 md:gap-2 md:px-7 md:pt-8">
        <h3 className={cn(heading, "text-[28px] leading-tight tracking-normal")}>{plan.name}</h3>
        <p className="text-[16px] leading-snug text-muted-foreground md:text-[17px] md:leading-normal">{plan.tagline}</p>
        <div className="mt-2 md:mt-4">
          <p className={cn(heading, "text-[28px] leading-none tracking-normal md:text-[34px]")}>{pricingUi.quoteOnly}</p>
          <p className="mt-1.5 text-[15px] leading-snug text-muted-foreground md:mt-2">{pricingUi.quoteNote}</p>
        </div>
      </CardHeader>
      <CardContent className="mt-4 grid gap-3 px-5 text-[15px] leading-snug md:hidden [&_ul]:gap-1">
        <div>
          <p className="mb-1 text-[15px] font-semibold text-muted-foreground">{pricingUi.rows.included}</p>
          <Items items={plan.included} />
        </div>
        <div>
          <p className="mb-1 text-[15px] font-semibold text-muted-foreground">{pricingUi.rows.frequency}</p>
          <p>{plan.frequency}</p>
        </div>
        <div>
          <p className="mb-1 text-[15px] font-semibold text-muted-foreground">{pricingUi.rows.options}</p>
          <Items items={plan.options} empty={pricingUi.noOption} />
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-6 pt-5 md:px-7 md:pb-8 md:pt-8">
        <Button asChild variant={rec ? "default" : "outline"} className="w-full">
          <Link href={plan.href} aria-label={pricingUi.buttonAria(plan.name, profileName)}>
            {plan.buttonLabel}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Comparison({ plans }: { plans: PricingPlan[] }) {
  const rows: { key: string; label: string; cell: (p: PricingPlan) => React.ReactNode }[] = [
    { key: "included", label: pricingUi.rows.included, cell: (p) => <Items items={p.included} /> },
    { key: "frequency", label: pricingUi.rows.frequency, cell: (p) => p.frequency },
    { key: "options", label: pricingUi.rows.options, cell: (p) => <Items items={p.options} empty={pricingUi.noOption} /> },
  ];
  return (
    <div className="mt-20 hidden overflow-hidden rounded-3xl border border-border bg-card backdrop-blur-xl md:block">
      <table className="w-full table-fixed border-collapse text-left text-[17px]">
        <caption className="sr-only">{pricingUi.tableCaption}</caption>
        <thead>
          <tr>
            <td className="w-[16%] p-5" />
            {plans.map((p) => (
              <th key={p.id} scope="col" className={cn(heading, "bg-muted p-5 text-[22px]", p.isRecommended && "text-primary")}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-border align-top">
              <th scope="row" className="p-5 text-[15px] font-semibold text-muted-foreground">
                {r.label}
              </th>
              {plans.map((p) => (
                <td key={p.id} className={cn("p-5", p.isRecommended && "bg-primary/5")}>
                  {r.cell(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PricingSection({ defaultProfile = "particulier" }: { defaultProfile?: Profile }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [active, setActive] = useState(() => Math.max(0, buildPlans(defaultProfile).findIndex((p) => p.isRecommended)));
  const plans = useMemo(() => buildPlans(profile), [profile]);
  const scroller = useRef<HTMLDivElement>(null);
  const recIndex = Math.max(0, plans.findIndex((p) => p.isRecommended));

  const cards = () => Array.from(scroller.current?.querySelectorAll<HTMLElement>("[data-plan-index]") ?? []);

  /** Centre une carte dans le carrousel sans jamais faire bouger la page (scrollIntoView peut la faire défiler). */
  const center = (i: number, smooth: boolean) => {
    const el = scroller.current;
    const card = cards()[i];
    if (!el || !card || el.scrollWidth <= el.clientWidth) return;
    const left = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left, behavior: smooth && !reduce ? "smooth" : "auto" });
  };

  // Au chargement et à chaque changement de profil : la formule recommandée est centrée.
  useEffect(() => {
    const id = requestAnimationFrame(() => center(recIndex, false));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, recIndex]);

  // Point actif : la carte la plus visible dans le carrousel.
  useEffect(() => {
    const root = scroller.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.intersectionRatio);
        let best = -1;
        let bestRatio = 0;
        cards().forEach((c, i) => {
          const r = ratios.get(c) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            best = i;
          }
        });
        if (best >= 0) setActive(best);
      },
      { root, threshold: [0.25, 0.5, 0.75, 1] },
    );
    cards().forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [profile]);

  return (
    <div>
      <ToggleGroup
        type="single"
        value={profile}
        onValueChange={(v) => v && setProfile(v as Profile)}
        aria-label={pricingUi.profileLabel}
      >
        {(["particulier", "societe"] as Profile[]).map((id) => (
          <ToggleGroupItem key={id} value={id} aria-label={pricingUi.profiles[id]}>
            {pricingUi.profiles[id]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* Mobile : carrousel natif (flex + défilement horizontal + snap). md et plus : grille de 3 colonnes. */}
      <div
        ref={scroller}
        role="region"
        aria-label={pricingUi.regionLabel}
        className="-mx-5 mt-10 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto overscroll-x-contain px-[max(1rem,calc((100%+2.5rem-min(82vw,340px))/2))] pb-8 pt-6 [scrollbar-width:none] md:mx-0 md:mt-14 md:grid md:snap-none md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 md:pt-0 lg:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {plans.map((p, i) => (
          <PlanCard key={`${profile}-${p.id}`} plan={p} profile={profile} index={i} />
        ))}
      </div>
      <div className="mt-1 flex justify-center md:hidden" role="group" aria-label={pricingUi.dotsLabel}>
        {plans.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={pricingUi.dotAria(p.name)}
            aria-current={active === i ? "true" : undefined}
            onClick={() => center(i, true)}
            className="grid h-11 w-9 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none", active === i ? "w-6 bg-primary" : "w-2 bg-border-strong")} />
          </button>
        ))}
      </div>
      <Comparison plans={plans} />
    </div>
  );
}
