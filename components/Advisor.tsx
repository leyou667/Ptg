"use client";

import { useEffect, useRef, useState } from "react";
import { advisor, formulas, type FormulaId, type Profile } from "@/content/fr";
import { whatsappLink } from "@/lib/config";
import { Star } from "./Star";

type Msg = { role: "user" | "assistant"; content: string };

export function Advisor({ profile, onClose, onChoose }: { profile: Profile; onClose: () => void; onChoose: (id: FormulaId) => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [rec, setRec] = useState<FormulaId | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    field.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, busy, rec]);

  // Échap ferme ; Tab reste dans le panneau.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key !== "Tab" || !dialog.current) return;
    const f = dialog.current.querySelectorAll<HTMLElement>("button, textarea, a[href]");
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setNotice(null);
    setRec(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, messages: history }),
      });
      if (res.status === 429) {
        setNotice(advisor.limit);
        setMessages(history);
        return;
      }
      if (!res.ok || !res.body) throw new Error("unavailable");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l) continue;
          const ev = JSON.parse(l) as { t: string; text?: string; formula?: FormulaId | null };
          if (ev.t === "delta" && ev.text) {
            acc += ev.text;
            setMessages([...history, { role: "assistant", content: acc }]);
          } else if (ev.t === "done") {
            if (ev.formula && formulas[profile].some((f) => f.id === ev.formula)) setRec(ev.formula);
          } else if (ev.t === "error") throw new Error("stream");
        }
      }
      if (!acc) throw new Error("empty");
    } catch {
      setMessages(history);
      setNotice(advisor.unavailable);
    } finally {
      setBusy(false);
    }
  };

  const recName = rec ? formulas[profile].find((f) => f.id === rec)?.name : undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 md:items-center md:justify-end md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advisor-title"
        onKeyDown={onKeyDown}
        className="flex max-h-[92svh] w-full flex-col bg-ground shadow-flotte md:h-[40rem] md:max-w-md"
      >
        <div className="flex items-center justify-between gap-3 bg-stone px-5 py-4">
          <h2 id="advisor-title" className="flex items-center gap-2 text-lg tracking-normal">
            <Star className="h-5 w-5 text-cyan" />
            {advisor.name}
          </h2>
          <button type="button" onClick={onClose} className="btn btn-ghost min-h-11 px-4 py-1.5 text-sm">
            {advisor.close}
          </button>
        </div>

        <div ref={log} className="flex-1 space-y-3 overflow-y-auto px-5 py-5" role="log" aria-live="polite" aria-relevant="additions text">
          <Bubble role="assistant">{advisor.welcome}</Bubble>
          {messages.map((m, i) =>
            m.role === "assistant" && !m.content ? (
              <Bubble key={i} role="assistant">
                <span className="soft">{advisor.thinking}</span>
              </Bubble>
            ) : (
              <Bubble key={i} role={m.role}>
                {m.content}
              </Bubble>
            ),
          )}
          {rec && !busy && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="btn btn-primary min-h-11 py-2" onClick={() => onChoose(rec)}>
                {advisor.choose}
                {recName ? ` (${recName})` : ""}
              </button>
              <button type="button" className="btn btn-ghost min-h-11 py-2" onClick={onClose}>
                {advisor.others}
              </button>
            </div>
          )}
          {notice && (
            <p role="alert" className="rounded-[12px] bg-stone p-3 text-[0.95rem]">
              {notice}{" "}
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                WhatsApp
              </a>
            </p>
          )}
        </div>

        <form
          className="bg-stone px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="advisor-input" className="sr-only">
            Votre message
          </label>
          <div className="flex gap-2">
            <textarea
              id="advisor-input"
              ref={field}
              rows={2}
              maxLength={600}
              value={input}
              placeholder={advisor.placeholder}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="champ resize-none"
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary self-end px-5">
              {advisor.send}
            </button>
          </div>
          <p className="mt-3 text-[0.8125rem] soft">{advisor.gdpr}</p>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : ""}`}>
      <p className={`max-w-[88%] rounded-[16px] px-4 py-3 text-[0.9875rem] leading-snug ${role === "user" ? "bg-ink text-white" : "bg-white"}`}>{children}</p>
    </div>
  );
}
