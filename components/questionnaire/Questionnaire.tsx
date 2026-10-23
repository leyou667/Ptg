"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formulas, site, type FormulaId, type Profile } from "@/content/fr";
import { errors as msg, flow } from "@/content/questionnaire";
import { particulierSchema, societeSchema } from "@/lib/requests/schema";
import { describeRequest, type Group } from "@/lib/requests/describe";
import { buildWhatsappMessage } from "@/lib/requests/whatsapp";
import { whatsappLink } from "@/lib/config";
import { FormulaCards } from "../FormulaCards";
import { Field } from "./Field";
import { initialValues, stepsFor, type StepDef, type Values } from "./config";

const Advisor = dynamic(() => import("../Advisor").then((m) => m.Advisor), { ssr: false });

type Done = { reference: string; accessToken: string; delai: string; emailed: boolean };

const schemaFor = (p: Profile) => (p === "particulier" ? particulierSchema : societeSchema);
const draftKey = (p: Profile) => `cheyclean-brouillon-${p}`;

/** Valide tout le formulaire. Le consentement est faussement coché ici : il n'est contrôlé qu'à l'envoi. */
function check(profile: Profile, values: Values) {
  const r = schemaFor(profile).safeParse({ profile, ...values, consent: true });
  const byField: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) byField[String(i.path[0])] ??= i.message;
  return { byField, data: r.success ? r.data : null };
}

export function Questionnaire({ profile, initialFormula }: { profile: Profile; initialFormula?: string }) {
  const steps = useMemo(() => stepsFor(profile), [profile]);
  const startFormula = (["essentiel", "confort", "pro", "premium"] as const).find((f) => f === initialFormula && formulas[profile].some((x) => x.id === f));
  const [values, setValues] = useState<Values>(() => initialValues(profile, startFormula));
  const [stepIdx, setStepIdx] = useState(0);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [done, setDone] = useState<Done | null>(null);
  const [fallback, setFallback] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [advisor, setAdvisor] = useState(false);
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = steps[stepIdx];

  /* Brouillon : les réponses survivent à un retour en arrière, à un rechargement ou à une erreur d'envoi. */
  /* Lecture unique du brouillon (stockage du navigateur, donc source externe) après l'hydratation. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey(profile));
      if (raw) {
        const d = JSON.parse(raw) as { values: Values; step: number };
        // Le brouillon n'est repris que si sa structure correspond au questionnaire actuel.
        const base = initialValues(profile);
        const keys = Object.keys(base);
        if (d?.values && keys.every((k) => k in d.values)) {
          setValues({ ...d.values, consent: false, website: "", ...(startFormula ? { formula: startFormula } : {}) });
          setStepIdx(Math.min(Math.max(0, d.step | 0), steps.length - 1));
          setRestored(Object.entries(d.values).some(([k, v]) => k !== "consent" && k !== "website" && k !== "billingCountry" && k !== "siteSameAsBilling" && k !== "formula" && v !== "" && v !== false));
        }
      }
    } catch {
      /* stockage indisponible : le formulaire fonctionne sans brouillon */
    }
    loaded.current = true;
  }, [profile, steps.length, startFormula]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded.current || status === "done") return;
    try {
      sessionStorage.setItem(draftKey(profile), JSON.stringify({ values: { ...values, consent: false }, step: stepIdx }));
    } catch {
      /* ignoré */
    }
  }, [values, stepIdx, profile, status]);

  useEffect(() => {
    if (loaded.current) heading.current?.focus({ preventScroll: false });
  }, [stepIdx, status]);

  const change = useCallback((name: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrs((e) => (e[name] ? { ...e, [name]: "" } : e));
    setSendError(null);
  }, []);

  const blur = useCallback(
    (name: string) => {
      setValues((v) => {
        const { byField } = check(profile, v);
        setErrs((e) => ({ ...e, [name]: byField[name] ?? "" }));
        return v;
      });
    },
    [profile],
  );

  const visibleFields = (s: StepDef) => s.fields.filter((f) => !f.showIf || f.showIf(values));

  const goNext = () => {
    const { byField } = check(profile, values);
    const mine = Object.fromEntries(visibleFields(step).map((f) => [f.name, byField[f.name] ?? ""]));
    if (Object.values(mine).some(Boolean)) {
      setErrs((e) => ({ ...e, ...mine }));
      // Amène le premier champ en erreur à l'écran.
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Avant le récapitulatif, tout le formulaire doit être valide : sinon on renvoie à la première étape fautive.
    if (steps[stepIdx + 1]?.kind === "recap") {
      const bad = steps.findIndex((s) => visibleFields(s).some((f) => byField[f.name]));
      if (bad >= 0) {
        setErrs((e) => ({ ...e, ...byField }));
        setStepIdx(bad);
        return;
      }
    }
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  };

  const parsed = useMemo(() => (step.kind === "recap" ? check(profile, values) : null), [step.kind, profile, values]);

  const groups: Group[] = parsed?.data ? describeRequest(parsed.data) : [];
  const groupStep = (title: string) => {
    const map = profile === "particulier" ? { [flow.groups.contact]: 0, [flow.groups.need]: 1, [flow.groups.formula]: 2 } : { [flow.groups.company]: 0, [flow.groups.contact]: 1, [flow.groups.need]: 2, [flow.groups.formula]: 3 };
    return map[title] ?? 0;
  };

  /** Message WhatsApp avec toutes les réponses ; null tant que le formulaire n'est pas valide. */
  const whatsappFor = (reference?: string) => {
    const r = check(profile, values);
    return r.data ? whatsappLink(buildWhatsappMessage(r.data, reference)) : null;
  };

  const send = async () => {
    if (!values.consent) {
      setErrs((e) => ({ ...e, consent: msg.consent }));
      return;
    }
    setStatus("sending");
    setSendError(null);
    setFallback(false);
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile, ...values }) });
      const body = await res.json().catch(() => ({}));
      if (res.status === 201 || (res.ok && body.ok)) {
        try {
          sessionStorage.removeItem(draftKey(profile));
        } catch {
          /* ignoré */
        }
        setDone(body as Done);
        setStatus("done");
        return;
      }
      if (res.status === 400 && Array.isArray(body.fields)) {
        const byField: Record<string, string> = {};
        for (const f of body.fields as { path: string; message: string }[]) byField[f.path] ??= f.message;
        setErrs((e) => ({ ...e, ...byField }));
        const idx = steps.findIndex((s) => s.fields.some((f) => byField[f.name]));
        if (idx >= 0) setStepIdx(idx);
        setSendError("Une information n'est pas valide. Corrigez le champ signalé.");
      } else {
        // Enregistrement impossible : WhatsApp reste possible, les réponses y sont déjà écrites.
        setFallback(true);
        if (res.status === 503) setSendError(flow.storageDown);
        else if (res.status === 429) setSendError("Trop d'envois depuis cette connexion. Réessayez dans quelques minutes ou envoyez votre demande sur WhatsApp.");
        else setSendError(flow.sendError);
      }
    } catch {
      setFallback(true);
      setSendError(flow.sendError);
    } finally {
      setStatus((s) => (s === "done" ? s : "idle"));
    }
  };

  const reset = () => {
    try {
      sessionStorage.removeItem(draftKey(profile));
    } catch {
      /* ignoré */
    }
    setValues(initialValues(profile));
    setStepIdx(0);
    setErrs({});
    setRestored(false);
  };

  const waText = `Bonjour CheyClean, je souhaite un devis (${profile === "societe" ? "société" : "particulier"}).`;
  const title = flow[profile].h1;

  /* ---------- Confirmation ---------- */
  if (status === "done" && done) {
    const waDone = whatsappFor(done.reference);
    return (
      <div className="container-x grid12 gap-y-8 pb-24 pt-10 md:pt-16">
        <div className="col-span-12 md:col-span-8">
          <h1 ref={heading} tabIndex={-1} className="rise outline-none">
            {flow.done.title}
          </h1>
          <p className="lead mt-8" role="status">
            {flow.done.text(done.delai)}
          </p>
          <div className="mt-8 panel p-6">
            <p className="small soft">{flow.done.reference}</p>
            <p className="mt-1 text-[1.75rem] font-bold tracking-tight" data-testid="reference">
              {done.reference}
            </p>
            {done.emailed && <p className="small soft mt-3">{flow.done.emailed}</p>}
          </div>
          <div className="mt-8">
            <a href={waDone ?? whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-primary" data-testid="whatsapp-send">
              {flow.whatsapp.send}
            </a>
            <p className="small soft mt-3 max-w-[52ch]">{flow.whatsapp.note}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/api/requests/${done.reference}/pdf?token=${done.accessToken}`} className="btn btn-ghost" download>
              {flow.done.pdf}
            </a>
            <Link href="/" className="btn btn-ghost">
              {flow.done.home}
            </Link>
          </div>
          <p className="small soft mt-6 max-w-[52ch]">{flow.done.pdfNote}</p>
        </div>
      </div>
    );
  }

  const progress = (stepIdx / (steps.length - 1)) * 100;

  const renderNav = (back?: () => void) => (
    <div className="mt-10 flex flex-wrap gap-3">
      {back && (
        <button type="button" onClick={back} className="btn btn-ghost">
          {flow.back}
        </button>
      )}
      <button type="button" onClick={goNext} className="btn btn-primary">
        {flow.next}
      </button>
    </div>
  );

  return (
    <div className="container-x pb-24 pt-10 md:pt-16">
      <header className="mb-10 max-w-4xl">
        <h1 className="rise" style={{ fontSize: "clamp(2.4rem, 7vw, 6rem)" }}>
          {title}
        </h1>
        <p className="lead rise mt-6" style={{ "--d": "120ms" } as React.CSSProperties}>
          {flow[profile].intro}
        </p>
      </header>

      <div className="grid12 gap-y-10">
        <div className="col-span-12 lg:col-span-8">
          <nav aria-label="Progression" className="mb-8">
            <ol className="flex flex-wrap gap-x-6 gap-y-1">
              {steps.map((s, i) => (
                <li key={s.id}>
                  {i < stepIdx ? (
                    <button type="button" className="min-h-11 font-semibold underline decoration-primary decoration-2 underline-offset-4" onClick={() => setStepIdx(i)}>
                      {s.title}
                    </button>
                  ) : (
                    <span aria-current={i === stepIdx ? "step" : undefined} className={`inline-flex min-h-11 items-center ${i === stepIdx ? "font-bold" : "soft"}`}>
                      {s.title}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <div className="h-1.5 bg-card" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Avancement">
              <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(6, progress)}%` }} />
            </div>
          </nav>

          {restored && stepIdx === 0 && (
            <p className="panel mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 small" role="status">
              {flow.restored}
              <button type="button" className="min-h-11 font-semibold underline underline-offset-4" onClick={reset}>
                {flow.restoredClear}
              </button>
            </p>
          )}

          <section key={step.id} aria-labelledby="step-title" className="rise">
            <h2 id="step-title" ref={heading} tabIndex={-1} className="mb-8 outline-none" style={{ fontSize: "clamp(1.75rem, 1rem + 2.4vw, 3rem)" }}>
              {step.kind === "formula" ? flow.formulaTitle : step.kind === "recap" ? flow.recapTitle : step.title}
            </h2>

            {step.kind === "fields" && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  goNext();
                }}
              >
                {/* Champ piège anti-spam, invisible pour les humains */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Site web
                    <input tabIndex={-1} autoComplete="off" value={String(values.website)} onChange={(e) => change("website", e.target.value)} />
                  </label>
                </div>
                <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
                  {visibleFields(step).map((f) => (
                    <Field key={f.name} def={f} value={values[f.name]} error={errs[f.name]} onChange={change} onBlur={blur} idPrefix={profile} values={values} />
                  ))}
                </div>
                {renderNav(stepIdx > 0 ? () => setStepIdx((i) => i - 1) : undefined)}
              </form>
            )}

            {step.kind === "formula" && (
              <div>
                <p className="lead">{flow.formulaHelp}</p>
                <div className="mt-10 md:py-6">
                  <FormulaCards items={formulas[profile]} profile={profile} selected={values.formula === "undecided" ? null : (values.formula as FormulaId)} onChoose={(id) => change("formula", id)} />
                </div>
                <div className="mt-12 flex flex-wrap items-center gap-3">
                  <button type="button" aria-pressed={values.formula === "undecided"} className={`btn ${values.formula === "undecided" ? "btn-primary" : "btn-ghost"}`} onClick={() => change("formula", "undecided")}>
                    {flow.undecided}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setAdvisor(true)}>
                    Demander conseil à l&apos;assistant
                  </button>
                </div>
                {values.formula === "undecided" && <p className="small soft mt-3">{flow.undecidedHelp}</p>}
                {renderNav(() => setStepIdx((i) => i - 1))}
              </div>
            )}

            {step.kind === "recap" && (
              <div>
                <p className="lead">{flow.recapHelp}</p>
                <div className="mt-8 grid gap-6">
                  {groups.map((g) => (
                    <div key={g.title} className="panel p-6" data-testid="recap-group">
                      <div className="flex items-start justify-between gap-4">
                        <h3>{g.title}</h3>
                        <button type="button" className="min-h-11 shrink-0 px-2 font-semibold underline underline-offset-4" onClick={() => setStepIdx(groupStep(g.title))}>
                          {flow.edit}
                        </button>
                      </div>
                      <dl className="mt-4 grid gap-3">
                        {g.rows.map(([k, v]) => (
                          <div key={k} className="grid gap-1 md:grid-cols-[12rem_1fr]">
                            <dt className="small soft font-semibold">{k}</dt>
                            <dd className="break-words whitespace-pre-line">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      id={`${profile}-consent`}
                      type="checkbox"
                      checked={values.consent === true}
                      onChange={(e) => change("consent", e.target.checked)}
                      aria-invalid={errs.consent ? true : undefined}
                      aria-describedby={errs.consent ? "err-consent" : undefined}
                      className="mt-0.5 h-6 w-6 shrink-0 accent-primary"
                    />
                    <span>
                      {flow.consent}{" "}
                      <Link href="/confidentialite" target="_blank" className="underline underline-offset-4">
                        {flow.consentLink}
                      </Link>
                    </span>
                  </label>
                  {errs.consent && (
                    <p id="err-consent" role="alert" className="erreur">
                      {errs.consent}
                    </p>
                  )}
                </div>

                {sendError && (
                  <p role="alert" className="erreur mt-6 max-w-xl text-base">
                    {sendError}
                  </p>
                )}
                {sendError && fallback && whatsappFor() && (
                  <div className="mt-4">
                    <a href={whatsappFor() ?? undefined} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" data-testid="whatsapp-fallback">
                      {flow.whatsapp.fallback}
                    </a>
                    <p className="small soft mt-2 max-w-[52ch]">{flow.whatsapp.fallbackNote}</p>
                  </div>
                )}
                <div className="mt-10 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setStepIdx((i) => i - 1)} className="btn btn-ghost">
                    {flow.back}
                  </button>
                  <button type="button" onClick={send} disabled={status === "sending"} className="btn btn-primary">
                    {status === "sending" ? flow.sending : flow.send}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="col-span-12 lg:col-span-3 lg:col-start-10" aria-label="Aide">
          <div className="panel p-6">
            <h3>Une question ?</h3>
            <p className="soft mt-2">Parlez à quelqu&apos;un plutôt que de remplir le formulaire.</p>
            <a href={site.phoneHref} className="mt-4 inline-flex min-h-11 items-center font-semibold underline decoration-primary decoration-2 underline-offset-4">
              {site.phoneDisplay}
            </a>
            <a href={whatsappLink(waText)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center font-semibold underline decoration-primary decoration-2 underline-offset-4">
              {site.whatsappLabel}
            </a>
          </div>
        </aside>
      </div>

      {advisor && (
        <Advisor
          profile={profile}
          onClose={() => setAdvisor(false)}
          onChoose={(id) => {
            change("formula", id);
            setAdvisor(false);
          }}
        />
      )}
    </div>
  );

}
