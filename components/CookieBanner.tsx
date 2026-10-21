"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cookies } from "@/content/fr";

const KEY = "cheyclean-cookies";
const EVENT = "cheyclean-cookies-change";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}
function read() {
  try {
    return localStorage.getItem(KEY) ?? "none";
  } catch {
    return "none";
  }
}

export function CookieBanner() {
  const stored = useSyncExternalStore(subscribe, read, () => "unknown");
  // Si le stockage est bloqué, on retient le choix en mémoire pour la session.
  const [memory, setMemory] = useState<string | null>(null);
  const choice = memory ?? stored;
  const [Analytics, setAnalytics] = useState<null | React.ComponentType>(null);

  useEffect(() => {
    if (choice !== "accepted") return;
    import("@vercel/analytics/next").then((m) => setAnalytics(() => m.Analytics as unknown as React.ComponentType));
  }, [choice]);

  const decide = (v: "accepted" | "refused") => {
    setMemory(v);
    try {
      localStorage.setItem(KEY, v);
      window.dispatchEvent(new Event(EVENT));
    } catch {}
  };

  const show = choice === "none" || choice === "unknown";
  return (
    <>
      {Analytics && <Analytics />}
      {show && (
        <div role="region" aria-label="Cookies" className="cookie-bar field-marine on-dark">
          <div className="container-x flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
            <p className="small font-medium">
              {cookies.text}{" "}
              <Link href="/cookies" className="underline underline-offset-4">
                En savoir plus
              </Link>
            </p>
            <div className="flex gap-3">
              <button type="button" className="btn btn-cyan min-h-11 flex-1 py-2 md:flex-none" onClick={() => decide("accepted")}>
                {cookies.accept}
              </button>
              <button type="button" className="btn btn-cyan min-h-11 flex-1 py-2 md:flex-none" onClick={() => decide("refused")}>
                {cookies.refuse}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
