"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formulas, frequencies, placeTypes, quote, type FormulaId, type Profile } from "@/content/fr";
import { phoneSchema } from "@/lib/schemas";
import { whatsappLink } from "@/lib/config";
import { FormulaCards } from "./FormulaCards";

const Advisor = dynamic(() => import("./Advisor").then((m) => m.Advisor), { ssr: false });

type Screen = "profile" | "type" | "surface" | "frequency" | "city" | "note" | "formulas" | "contact" | "done";
const SCREENS: Screen[] = ["profile", "type", "surface", "frequency", "city", "note", "formulas", "contact", "done"];
const STEP_OF: Record<Screen, number> = { profile: 1, type: 2, surface: 2, frequency: 2, city: 2, note: 2, formulas: 3, contact: 4, done: 5 };

type Initial = { profil?: string; formule?: string; ville?: string };

type Form = {
  profile: Profile | null;
  type: string;
  surface: number;
  frequency: string;
  city: string;
  note: string;
  formula: FormulaId | null;
  name: string;
  phone: string;
  email: string;
  consent: boolean;
  website: string;
};

const profileLabel = (p: Profile | null) => (p === "particulier" ? "Particulier" : p === "societe" ? "Société" : "");

export function QuoteFlow({ initial }: { initial: Initial }) {
  const reduce = useReducedMotion();
  const startProfile: Profile | null = initial.profil === "particulier" || initial.profil === "societe" ? initial.profil : null;
  const startFormula = (["essentiel", "confort", "pro", "premium"] as const).find((f) => f === initial.formule) ?? null;

  const [screen, setScreen] = useState<Screen>(startProfile ? "type" : "profile");
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Form>({
    profile: startProfile,
    type: "",
    surface: 80,
    frequency: "",
    city: (initial.ville ?? "").slice(0, 80),
    note: "",
    formula: startFormula && startProfile && formulas[startProfile].some((f) => f.id === startFormula) ? startFormula : null,
    name: "",
    phone: "",
    email: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [delai, setDelai] = useState("24 heures");
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const go = (to: Screen) => {
    setDir(SCREENS.indexOf(to) >= SCREENS.indexOf(screen) ? 1 : -1);
    setScreen(to);
  };

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo?.({ top: Math.min(window.scrollY, 140) });
  }, [screen]);

  const formulaName = useMemo(
    () => (form.profile && form.formula ? formulas[form.profile].find((f) => f.id === form.formula)?.name : undefined),
    [form.profile, form.formula],
  );

  const recap: [string, string][] = [
    ["Profil", profileLabel(form.profile)],
    ["Lieu", form.type],
    ["Surface", form.type || screen !== "type" ? `${form.surface} m²` : ""],
    ["Fréquence", form.frequency],
    ["Ville", form.city.trim()],
    ["Remarque", form.note.trim()],
    ["Formule", formulaName ?? ""],
  ];
  // La surface n'apparaît qu'une fois la question atteinte.
  const surfaceReached = SCREENS.indexOf(screen) > SCREENS.indexOf("surface");
  const visibleRecap = recap.filter(([k, v]) => v && (k !== "Surface" || surfaceReached));

  const next = () => {
    const i = SCREENS.indexOf(screen);
    const e: Partial<Record<keyof Form, string>> = {};
    if (screen === "type" && !form.type) e.type = quote.errors.required("type de lieu");
    if (screen === "frequency" && !form.frequency) e.frequency = quote.errors.required("fréquence");
    if (screen === "city" && !form.city.trim()) e.city = quote.errors.required("ville ou code postal");
    if (screen === "surface" && !(form.surface >= 5)) e.surface = quote.errors.required("surface");
    if (Object.keys(e).length) return setErrors(e);
    go(SCREENS[i + 1]);
  };
  const back = () => go(SCREENS[Math.max(0, SCREENS.indexOf(screen) - 1)]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Partial<Record<keyof Form, string>> = {};
    if (form.name.trim().length < 2) e.name = quote.errors.required("nom complet");
    if (!form.phone.trim()) e.phone = quote.errors.required("téléphone");
    else if (!phoneSchema.safeParse(form.phone).success) e.phone = quote.errors.phone;
    if (!form.email.trim()) e.email = quote.errors.required("email");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = quote.errors.email;
    if (!form.consent) e.consent = quote.errors.consent;
    if (Object.keys(e).length) return setErrors(e);

    setSending(true);
    setSendError(false);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, surface: form.surface }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { delai?: string };
      if (data.delai) setDelai(data.delai);
      go("done");
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const waLink = whatsappLink(
    quote.whatsappMessage({
      profil: profileLabel(form.profile).toLowerCase(),
      type: form.type,
      surface: form.surface,
      ville: form.city.trim(),
      frequence: form.frequency.toLowerCase(),
      formule: formulaName ?? "à définir",
    }),
  );

  const stepNo = STEP_OF[screen];
  const progress = SCREENS.indexOf(screen) / (SCREENS.length - 1);
  const slide = reduce ? {} : { initial: { opacity: 0, x: 24 * dir }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 * dir } };

  const renderTitle = (children: React.ReactNode) => (
    <h2 ref={heading} tabIndex={-1} className="text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] outline-none">
      {children}
    </h2>
  );
  const renderNav = (hideNext = false) => (
    <div className="mt-10 flex flex-wrap gap-3">
      {screen !== "profile" && !(startProfile && screen === "type") && (
        <button type="button" onClick={back} className="btn btn-ghost">
          {quote.back}
        </button>
      )}
      {!hideNext && (
        <button type="button" onClick={next} className="btn btn-primary">
          {quote.next}
        </button>
      )}
    </div>
  );

  const choices = (name: keyof Form, options: string[], value: string, error?: string) => (
    <div role="radiogroup" aria-label={String(name)} className="mt-8 grid gap-3 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => set(name, o as never)}
          className={`min-h-14 px-5 py-3 text-left font-semibold transition-colors ${
            value === o ? "bg-marine text-white" : "bg-brume hover:bg-marine hover:text-white"
          }`}
        >
          {o}
        </button>
      ))}
      {error && (
        <p role="alert" className="erreur sm:col-span-2">
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div data-chapter="light" className="container-x pb-24 pt-10 md:pt-16">
      <header className="mb-12 max-w-4xl">
        <h1 className="rise">{quote.title}</h1>
        <p className="lead rise mt-6" style={{ "--d": "120ms" } as React.CSSProperties}>{quote.intro}</p>
      </header>

      {screen !== "done" && (
        <div className="rise mb-8" style={{ "--d": "220ms" } as React.CSSProperties} aria-label="Progression">
          <p className="sr-only">{quote.steps[stepNo - 1]}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-brume" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <div className="h-full rounded-full bg-marine transition-[width] duration-300" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Mobile : récapitulatif repliable */}
      {screen !== "done" && (
        <details className={`panel mb-8 ${screen === "formulas" ? "" : "lg:hidden"}`}>
          <summary className="flex min-h-12 cursor-pointer items-center px-5 font-semibold">{quote.summaryToggle}</summary>
          <Recap items={visibleRecap} />
        </details>
      )}

      <div className={screen === "done" || screen === "formulas" ? "" : "grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16"}>
        <div className="rise min-h-[24rem]" style={{ "--d": "320ms" } as React.CSSProperties}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={screen} transition={{ duration: 0.22, ease: "easeOut" }} {...slide}>
              {screen === "profile" && (
                <>
                  {renderTitle(quote.profile.question)}
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {(["particulier", "societe"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, profile: p, type: f.profile === p ? f.type : "", formula: f.profile === p ? f.formula : null }));
                          go("type");
                        }}
                        className="panel min-h-40 p-6 text-left transition-colors hover:bg-marine hover:text-white"
                      >
                        <span className="block text-[1.5rem] font-bold leading-tight tracking-tight">{quote.profile[p].title}</span>
                        <span className="mt-2 block opacity-80">{quote.profile[p].text}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {screen === "type" && form.profile && (
                <>
                  {renderTitle(quote.type.question)}
                  {choices("type", placeTypes[form.profile], form.type, errors.type)}
                  {renderNav()}
                </>
              )}

              {screen === "surface" && (
                <>
                  {renderTitle(quote.surface.question)}
                  <p className="mt-3 soft">{quote.surface.help}</p>
                  <div className="mt-8 grid items-center gap-6 sm:grid-cols-[1fr_9rem]">
                    <input
                      type="range"
                      min={10}
                      max={1000}
                      step={5}
                      value={Math.min(1000, Math.max(10, form.surface || 10))}
                      onChange={(e) => set("surface", Number(e.target.value))}
                      aria-label="Surface en mètres carrés"
                      className="h-11 w-full accent-[#0b1f3f]"
                    />
                    <label className="relative block">
                      <span className="sr-only">Surface en m²</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={5}
                        max={100000}
                        value={form.surface || ""}
                        onChange={(e) => set("surface", Math.min(100000, Number(e.target.value)))}
                        className="champ pr-12"
                        aria-invalid={!!errors.surface}
                      />
                      <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 soft">
                        {quote.surface.unit}
                      </span>
                    </label>
                  </div>
                  {errors.surface && <p role="alert" className="erreur">{errors.surface}</p>}
                  {renderNav()}
                </>
              )}

              {screen === "frequency" && (
                <>
                  {renderTitle(quote.frequency.question)}
                  {choices("frequency", frequencies, form.frequency, errors.frequency)}
                  {renderNav()}
                </>
              )}

              {screen === "city" && (
                <>
                  {renderTitle(quote.city.question)}
                  <label className="mt-8 block max-w-md">
                    <span className="mb-2 block font-semibold">{quote.city.label}</span>
                    <input
                      className="champ"
                      value={form.city}
                      autoComplete="address-level2"
                      maxLength={80}
                      onChange={(e) => set("city", e.target.value)}
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? "err-city" : undefined}
                    />
                    {errors.city && <p id="err-city" role="alert" className="erreur">{errors.city}</p>}
                  </label>
                  {renderNav()}
                </>
              )}

              {screen === "note" && (
                <>
                  {renderTitle(quote.note.question)}
                  <p className="mt-3 soft">{quote.note.help}</p>
                  <label className="mt-8 block max-w-xl">
                    <span className="mb-2 block font-semibold">{quote.note.label}</span>
                    <textarea className="champ min-h-32" maxLength={600} value={form.note} onChange={(e) => set("note", e.target.value)} />
                  </label>
                  {renderNav()}
                </>
              )}

              {screen === "formulas" && form.profile && (
                <>
                  {renderTitle(quote.formulas.title)}
                  <div className="mt-10 md:py-5">
                    <FormulaCards
                      items={formulas[form.profile]}
                      profile={form.profile}
                      selected={form.formula}
                      onChoose={(id) => {
                        set("formula", id);
                        go("contact");
                      }}
                    />
                  </div>
                  <div className="mt-12 flex flex-wrap items-center gap-4">
                    <p className="font-semibold">{quote.formulas.unsure}</p>
                    <button type="button" className="btn btn-ghost" onClick={() => setAdvisorOpen(true)}>
                      {quote.formulas.advice}
                    </button>
                  </div>
                  {renderNav(true)}
                </>
              )}

              {screen === "contact" && (
                <form onSubmit={submit} noValidate>
                  {renderTitle(quote.contact.title)}
                  {/* Champ piège anti-spam, invisible pour les humains */}
                  <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Site web
                      <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                    </label>
                  </div>
                  <div className="mt-8 grid max-w-xl gap-6">
                    <Field id="name" label={quote.contact.name} error={errors.name}>
                      <input id="name" className="champ" autoComplete="name" value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "err-name" : undefined} />
                    </Field>
                    <Field id="phone" label={quote.contact.phone} error={errors.phone}>
                      <input id="phone" type="tel" inputMode="tel" className="champ" autoComplete="tel" value={form.phone} maxLength={30} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "err-phone" : undefined} />
                    </Field>
                    <Field id="email" label={quote.contact.email} error={errors.email}>
                      <input id="email" type="email" inputMode="email" className="champ" autoComplete="email" value={form.email} maxLength={160} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "err-email" : undefined} />
                    </Field>
                    <div>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-[#0b1f3f]" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "err-consent" : undefined} />
                        <span>
                          {quote.contact.consent}{" "}
                          <Link href="/confidentialite" target="_blank" className="underline underline-offset-4">
                            {quote.contact.privacy}
                          </Link>
                        </span>
                      </label>
                      {errors.consent && <p id="err-consent" role="alert" className="erreur">{errors.consent}</p>}
                    </div>
                  </div>

                  {sendError && (
                    <p role="alert" className="erreur mt-6 max-w-xl text-base">
                      {quote.errors.send}
                    </p>
                  )}
                  <div className="mt-10 flex flex-wrap gap-3">
                    <button type="button" onClick={back} className="btn btn-ghost">
                      {quote.back}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      {sending ? quote.contact.sending : quote.contact.send}
                    </button>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-cyan">
                      {quote.contact.whatsapp}
                    </a>
                  </div>
                </form>
              )}

              {screen === "done" && (
                <div className="max-w-xl">
                  {renderTitle(quote.done.title)}
                  <p className="mt-5 text-xl" role="status">
                    {quote.done.text(delai)}
                  </p>
                  <Link href="/" className="btn btn-primary mt-10">
                    {quote.done.home}
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {screen !== "done" && screen !== "formulas" && (
          <aside aria-label={quote.summaryTitle} className="panel hidden self-start lg:sticky lg:top-24 lg:block">
            <h3 className="px-6 pt-6 text-xl">{quote.summaryTitle}</h3>
            <Recap items={visibleRecap} />
          </aside>
        )}
      </div>

      {advisorOpen && form.profile && (
        <Advisor
          profile={form.profile}
          onClose={() => setAdvisorOpen(false)}
          onChoose={(id) => {
            set("formula", id);
            setAdvisorOpen(false);
            go("contact");
          }}
        />
      )}
    </div>
  );
}

function Recap({ items }: { items: [string, string][] }) {
  return items.length === 0 ? (
    <p className="px-6 pb-6 pt-3 soft lg:pt-3">{quote.summaryEmpty}</p>
  ) : (
    <dl className="grid gap-4 px-6 pb-6 pt-4">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-sm font-semibold soft">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`err-${id}`} role="alert" className="erreur">
          {error}
        </p>
      )}
    </div>
  );
}
