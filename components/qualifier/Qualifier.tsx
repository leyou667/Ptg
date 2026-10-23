"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { formulas, frequencies, qualifierPlaces, qualifierSurfaces, qualifierUi, type FormulaId, type Profile } from "@/content/fr";
import { buildPlans } from "@/components/pricing/plans";
import { devisHref, fallbackAdvice, fallbackFormula, PROFILES, type Answers } from "@/lib/qualifier";
import { cn } from "@/lib/utils";
import { Star } from "../Star";

type Step = "lieu" | "surface" | "frequence";
const STEPS: Step[] = ["lieu", "surface", "frequence"];
type Result = { formule: FormulaId; conseil: string; source: "ia" | "regles" };

/** Au-delà de ce délai côté navigateur, on passe aux règles simples (le serveur a déjà son propre délai). */
const CLIENT_TIMEOUT_MS = 9500;
/** Le chargement reste visible un instant, même si la réponse est immédiate : pas de clignotement. */
const MIN_LOADING_MS = 1100;

/**
 * « Quelle formule pour moi ? » : un profil, trois questions à cartes, un conseil, puis le devis prérempli.
 * Ce n'est pas un chat : aucune saisie libre, aucun bouton flottant.
 */
export function Qualifier() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [phase, setPhase] = useState<"ask" | "loading" | "result">("ask");
  const [result, setResult] = useState<Result | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const run = useRef(0); // numéro de la demande en cours : une réponse tardive d'un ancien parcours est ignorée
  const moved = useRef(false);

  const step = STEPS[stepIdx];

  // Le focus suit l'écran affiché (lecteurs d'écran et clavier), sauf au premier affichage de la page.
  useEffect(() => {
    if (!moved.current) return;
    heading.current?.focus({ preventScroll: true });
  }, [profile, stepIdx, phase]);

  const pick = (p: Profile) => {
    if (p === profile) return;
    moved.current = true;
    run.current++;
    setProfile(p);
    setStepIdx(0);
    setAnswers({});
    setResult(null);
    setPhase("ask");
    // Le panneau de questions apparaît sous les cartes : on le ramène à l'écran sans saut brusque.
    requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" }));
  };

  const finish = useCallback(async (p: Profile, a: Answers) => {
    const id = ++run.current;
    setPhase("loading");
    const started = Date.now();
    const local = (): Result => {
      const formule = fallbackFormula(p, a);
      return { formule, conseil: fallbackAdvice(p, formule, a), source: "regles" };
    };
    let out: Result;
    try {
      const ctl = new AbortController();
      const timer = window.setTimeout(() => ctl.abort(), CLIENT_TIMEOUT_MS);
      const res = await fetch("/api/conseil", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: p, lieu: a.lieu, surface: a.surface, frequence: a.frequence }),
        signal: ctl.signal,
      });
      window.clearTimeout(timer);
      const data = (await res.json().catch(() => null)) as Result | null;
      const ok = res.ok && data && typeof data.conseil === "string" && formulas[p].some((f) => f.id === data.formule);
      out = ok ? { formule: data.formule, conseil: data.conseil, source: data.source === "ia" ? "ia" : "regles" } : local();
    } catch {
      out = local();
    }
    const wait = MIN_LOADING_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (id !== run.current) return;
    setResult(out);
    setPhase("result");
  }, []);

  const choose = (value: string) => {
    if (!profile || phase !== "ask") return;
    moved.current = true;
    const next = { ...answers, [step]: value } as Partial<Answers>;
    setAnswers(next);
    window.setTimeout(() => {
      if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
      else void finish(profile, next as Answers);
    }, 160);
  };

  const back = () => {
    moved.current = true;
    if (phase === "result") {
      setPhase("ask");
      setStepIdx(STEPS.length - 1);
    } else if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const restart = () => {
    moved.current = true;
    run.current++;
    setAnswers({});
    setResult(null);
    setStepIdx(0);
    setPhase("ask");
  };

  const options: { value: string; label: string }[] = !profile
    ? []
    : step === "lieu"
      ? qualifierPlaces[profile].map((p) => ({ value: p.label, label: p.label }))
      : step === "surface"
        ? qualifierSurfaces[profile].map((s) => ({ value: s.id, label: s.label }))
        : frequencies.map((f) => ({ value: f, label: f }));

  const plan = result && profile ? buildPlans(profile).find((p) => p.id === result.formule) : undefined;
  const summary =
    profile && result
      ? [answers.lieu, qualifierSurfaces[profile].find((s) => s.id === answers.surface)?.label, answers.frequence].filter(Boolean)
      : [];

  return (
    <div>
      <div role="group" aria-label={qualifierUi.profileQuestion} className="flex flex-col gap-3 md:flex-row md:gap-5">
        {PROFILES.map((p) => {
          const chosen = profile === p;
          const other = profile !== null && !chosen;
          return (
            <button
              key={p}
              type="button"
              aria-label={qualifierUi.profiles[p].aria}
              aria-pressed={chosen}
              onClick={() => pick(p)}
              className={cn(
                "group glass flex min-h-[4.5rem] flex-col justify-between rounded-3xl p-5 text-left transition-all duration-500 ease-out motion-reduce:transition-none md:p-8",
                profile === null && "md:flex-1 md:min-h-[12rem]",
                chosen && "border-primary bg-primary/10 ring-2 ring-primary md:flex-[1.5]",
                other && "scale-[0.985] opacity-70 hover:opacity-100 md:flex-[0.8]",
                !chosen && "hover:bg-muted",
              )}
            >
              <span className={cn("font-display font-semibold leading-none transition-[font-size] duration-500", other ? "text-[1.5rem] md:text-[2rem]" : "text-[2rem] md:text-[3.25rem]")} style={{ letterSpacing: "-0.02em" }}>
                {qualifierUi.profiles[p].word}
              </span>
              {/* Description repliée (hauteur animée) quand l'autre carte est choisie. */}
              <span className={cn("grid transition-[grid-template-rows,margin] duration-500", other ? "mt-0 grid-rows-[0fr]" : chosen ? "mt-0 grid-rows-[0fr] md:mt-4 md:grid-rows-[1fr]" : "mt-4 grid-rows-[1fr]")}>
                <span className="overflow-hidden text-[1.0625rem] text-muted-foreground">{qualifierUi.profiles[p].text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {profile && (
        <div ref={panel} className="glass mt-5 rounded-3xl p-5 md:mt-6 md:p-8" aria-live="polite">
          {phase === "loading" && (
            <div key="loading" className="step-in grid min-h-[16rem] place-items-center text-center" role="status">
              <div className="grid justify-items-center gap-5">
                <Star className="qualifier-pulse h-14 w-14 text-primary" />
                <p ref={heading as unknown as React.RefObject<HTMLParagraphElement>} tabIndex={-1} className="font-display text-[1.5rem] font-semibold outline-none">
                  {qualifierUi.loading}
                </p>
              </div>
            </div>
          )}

          {phase === "ask" && (
            <div key={`ask-${step}`} className="step-in">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={stepIdx > 0 ? back : () => { moved.current = true; run.current++; setProfile(null); setAnswers({}); }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-[0.9375rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                  {stepIdx > 0 ? qualifierUi.back : qualifierUi.change}
                </button>
                <p className="ml-auto text-[0.9375rem] font-medium tabular-nums text-muted-foreground">{stepIdx + 1}/{STEPS.length}</p>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-label={qualifierUi.progress(stepIdx + 1, STEPS.length)} aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIdx + 1}>
                <div className="h-full origin-left rounded-full bg-primary transition-transform duration-500" style={{ transform: `scaleX(${(stepIdx + 1) / STEPS.length})` }} />
              </div>
              <h3 ref={heading} tabIndex={-1} className="mt-6 text-[1.75rem] leading-tight outline-none md:text-[2.25rem]">
                {qualifierUi.questions[profile][step]}
              </h3>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" role="group" aria-label={qualifierUi.questions[profile][step]}>
                {options.map((o) => {
                  const selected = answers[step] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose(o.value)}
                      className={cn(
                        "flex min-h-16 items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-[1.0625rem] font-medium leading-snug transition-all duration-200 active:scale-[0.98] motion-reduce:transition-none",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-card hover:bg-muted",
                      )}
                    >
                      <span>{o.label}</span>
                      {selected && <Check aria-hidden className="h-5 w-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {phase === "result" && result && (
            <div key="result" className="step-in">
              <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-2 rounded-full pr-3 text-[0.9375rem] font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft aria-hidden className="h-4 w-4" />
                {qualifierUi.back}
              </button>
              <p className="mt-2 flex items-center gap-2 text-[0.9375rem] font-semibold text-champagne">
                <Star className="h-4 w-4" />
                {qualifierUi.recommended}
              </p>
              <h3 ref={heading} tabIndex={-1} className="mt-2 text-[2.5rem] leading-none outline-none md:text-[3.5rem]">
                {formulas[profile].find((f) => f.id === result.formule)?.name}
              </h3>
              <p className="mt-5 max-w-[60ch] text-[1.125rem] leading-relaxed">{result.conseil}</p>
              {plan && (
                <ul className="mt-5 grid gap-2 text-[1rem]">
                  {plan.included.slice(0, 3).map((x) => (
                    <li key={x} className="flex items-start gap-2.5">
                      <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      {x}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-5 flex flex-wrap gap-2 text-[0.9375rem]" aria-label={qualifierUi.summaryLabel}>
                {summary.map((s) => (
                  <span key={s} className="rounded-full border border-border-strong px-3 py-1">
                    {s}
                  </span>
                ))}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href={devisHref(profile, result.formule, answers as Answers)} className="btn btn-primary min-h-14 px-8 text-lg">
                  {qualifierUi.cta}
                </Link>
                <button type="button" onClick={restart} className="btn btn-ghost min-h-14 px-6">
                  {qualifierUi.restart}
                </button>
              </div>
              <p className="mt-4 text-[0.9375rem] text-muted-foreground">
                {qualifierUi.ctaNote} · {result.source === "ia" ? qualifierUi.sourceAi : qualifierUi.sourceRules}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
