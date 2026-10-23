"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { assistantUi, site, type FormulaId, type Profile } from "@/content/fr";
import { whatsappLink } from "@/lib/config";
import { cn } from "@/lib/utils";

type Quote = { profile: Profile; formula: FormulaId };
type Msg = { role: "user" | "assistant"; content: string; quote?: Quote };

const KEY = "cheyclean-assistant-v1";
const MAX_LEN = 600;
const MAX_USER_TURNS = 8; // même limite que l'API
const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function load(): Msg[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(data) ? data.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-17) : [];
  } catch {
    return [];
  }
}

/** Fenêtre de chat : conseil de formule en streaming, au plus 2 ou 3 questions, puis proposition d'envoyer le devis. */
export function QuoteAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  // La conversation est gardée tant que l'onglet reste ouvert (sessionStorage, jamais envoyée ailleurs que pour répondre).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(load());
    field.current?.focus();
    return () => abort.current?.abort();
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(messages.filter((m) => m.content)));
    } catch {
      /* ignoré */
    }
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight; // défilement du journal seulement : la page ne bouge pas
  }, [messages, busy]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, MAX_LEN);
      if (!content || busy) return;
      if (messages.filter((m) => m.role === "user").length >= MAX_USER_TURNS) {
        setNotice(assistantUi.limit);
        return;
      }
      setNotice(null);
      setInput("");
      const history: Msg[] = [...messages, { role: "user", content }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setBusy(true);
      const ctl = new AbortController();
      abort.current = ctl;
      const fail = (message: string) => {
        setNotice(message);
        setMessages((m) => (m[m.length - 1]?.role === "assistant" && !m[m.length - 1].content ? m.slice(0, -1) : m));
      };
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history.map(({ role, content: c }) => ({ role, content: c })) }),
          signal: ctl.signal,
        });
        if (!res.ok || !res.body) {
          fail(res.status === 503 ? assistantUi.unavailable : res.status === 429 ? assistantUi.limit : assistantUi.error);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          const [text2] = raw.split("\u0001");
          setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: text2 } : x)));
        }
        const [textFinal, tail] = raw.split("\u0001");
        let quote: Quote | undefined;
        if (tail) {
          const [profile, formula] = tail.split(":");
          if ((profile === "particulier" || profile === "societe") && ["essentiel", "confort", "pro", "premium"].includes(formula)) {
            quote = { profile, formula: formula as FormulaId };
          }
        }
        if (!textFinal.trim()) fail(assistantUi.error);
        else setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: textFinal.trim(), quote } : x)));
      } catch (e) {
        if ((e as Error).name !== "AbortError") fail(assistantUi.unavailable);
      } finally {
        setBusy(false);
        field.current?.focus();
      }
    },
    [busy, messages],
  );

  const reset = () => {
    abort.current?.abort();
    setMessages([]);
    setNotice(null);
    setBusy(false);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignoré */
    }
    field.current?.focus();
  };

  // Échap ferme ; Tab reste dans le panneau.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !dialog.current) return;
    const items = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const hasUser = messages.some((m) => m.role === "user");
  const last = messages[messages.length - 1];
  const typing = busy && last?.role === "assistant" && !last.content;

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={assistantUi.dialogLabel}
      onKeyDown={onKeyDown}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      className="fixed inset-0 z-[60] flex flex-col border-border bg-background/95 text-foreground backdrop-blur-xl md:inset-auto md:bottom-24 md:right-6 md:h-[560px] md:w-[380px] md:rounded-3xl md:border md:bg-background/85 md:shadow-flotte"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="font-display text-[1.125rem] font-semibold leading-tight tracking-normal">{assistantUi.title}</h2>
        <div className="flex items-center gap-1">
          {hasUser && (
            <button type="button" onClick={reset} className="min-h-11 whitespace-nowrap rounded-full px-3 text-[0.875rem] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              {assistantUi.reset}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label={assistantUi.close} className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div ref={log} role="log" aria-live="polite" aria-relevant="additions text" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
        <Bubble role="assistant">{assistantUi.welcome}</Bubble>
        {!hasUser && (
          <div className="flex flex-wrap gap-2 pt-1">
            {assistantUi.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="min-h-11 rounded-full border border-border-strong px-4 text-[0.9375rem] font-medium transition-colors hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.content ? (
            <div key={i} className="grid gap-2">
              <Bubble role={m.role}>{m.content}</Bubble>
              {m.quote && (
                <Link href={`/devis/${m.quote.profile}?formule=${m.quote.formula}`} className="btn btn-primary justify-self-start text-[0.9375rem]" onClick={onClose}>
                  {assistantUi.quoteCta}
                </Link>
              )}
            </div>
          ) : null,
        )}
        {typing && (
          <div className="flex" role="status" aria-label={assistantUi.typing}>
            <span className="flex gap-1.5 rounded-2xl border border-border bg-card px-4 py-3" aria-hidden>
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none" style={{ animationDelay: `${d * 160}ms` }} />
              ))}
            </span>
          </div>
        )}
        {notice && (
          <p role="alert" className="rounded-2xl border border-border bg-card px-4 py-3 text-[0.9375rem]">
            {notice}
          </p>
        )}
      </div>

      <div className="grid gap-2 border-t border-border px-4 pb-3 pt-3">
        <a
          href={whatsappLink(site.whatsappGreeting)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong px-4 text-[0.9375rem] font-semibold transition-colors hover:bg-muted"
        >
          {assistantUi.whatsapp}
        </a>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            ref={field}
            aria-label={assistantUi.inputLabel}
            placeholder={assistantUi.placeholder}
            value={input}
            maxLength={MAX_LEN}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Entrée envoie ; Maj+Entrée saute une ligne.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-muted px-4 py-2.5 text-[1rem] text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label={assistantUi.send}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Send aria-hidden className="h-5 w-5" />
          </button>
        </form>
        <p className="text-[0.8125rem] leading-snug text-muted-foreground">{assistantUi.privacy}</p>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" && "justify-end")}>
      <p
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[0.9875rem] leading-snug",
          role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground",
        )}
      >
        {children}
      </p>
    </div>
  );
}
