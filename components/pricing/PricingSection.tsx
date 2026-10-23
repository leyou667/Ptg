"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { pricingUi, type Profile } from "@/content/fr";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildPlans, type PricingPlan } from "./plans";

const heading = "font-[family-name:var(--font-fraunces)] font-semibold";

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

function PlanCard({ plan, profile }: { plan: PricingPlan; profile: Profile }) {
  const rec = plan.isRecommended;
  const profileName = pricingUi.profiles[profile];
  return (
    <Card
      aria-label={`Formule ${plan.name}`}
      className={cn(
        "relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgb(20_35_58/0.05),0_18px_36px_-14px_rgb(20_35_58/0.2)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        rec ? "order-first border-primary ring-2 ring-primary md:order-none md:z-10 md:scale-[1.05]" : "",
      )}
    >
      {rec && (
        <span className="absolute left-7 top-0 -translate-y-1/2 rounded-full bg-primary px-4 py-1 text-[14px] font-semibold text-primary-foreground">
          {pricingUi.recommended}
        </span>
      )}
      <CardHeader>
        <h3 className={cn(heading, "text-[28px] leading-tight tracking-normal")}>{plan.name}</h3>
        <p className="text-[17px] text-muted-foreground">{plan.tagline}</p>
        <div className="mt-4">
          <p className={cn(heading, "text-[34px] leading-none tracking-normal")}>{pricingUi.quoteOnly}</p>
          <p className="mt-2 text-[15px] text-muted-foreground">{pricingUi.quoteNote}</p>
        </div>
      </CardHeader>
      <CardContent className="mt-6 grid gap-5 md:hidden">
        <div>
          <p className="mb-2 text-[15px] font-semibold text-muted-foreground">{pricingUi.rows.included}</p>
          <Items items={plan.included} />
        </div>
        <div>
          <p className="mb-2 text-[15px] font-semibold text-muted-foreground">{pricingUi.rows.frequency}</p>
          <p>{plan.frequency}</p>
        </div>
        <div>
          <p className="mb-2 text-[15px] font-semibold text-muted-foreground">{pricingUi.rows.options}</p>
          <Items items={plan.options} empty={pricingUi.noOption} />
        </div>
      </CardContent>
      <CardFooter className="pt-8">
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
    <div className="mt-20 hidden overflow-hidden rounded-3xl border border-border bg-card md:block">
      <table className="w-full table-fixed border-collapse text-left text-[17px]">
        <caption className="sr-only">{pricingUi.tableCaption}</caption>
        <thead>
          <tr>
            <td className="w-[16%] p-5" />
            {plans.map((p) => (
              <th key={p.id} scope="col" className={cn(heading, "bg-muted/40 p-5 text-[22px]", p.isRecommended && "text-primary")}>
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
  const plans = useMemo(() => buildPlans(profile), [profile]);
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
      <div className="mt-14 grid items-stretch gap-10 md:grid-cols-3 md:gap-5 lg:gap-8">
        {plans.map((p) => (
          <PlanCard key={`${profile}-${p.id}`} plan={p} profile={profile} />
        ))}
      </div>
      <Comparison plans={plans} />
    </div>
  );
}
