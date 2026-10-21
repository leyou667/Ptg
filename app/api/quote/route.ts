import { quoteSchema, type QuoteInput } from "@/lib/schemas";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { formulas, frequencies } from "@/content/fr";

export const runtime = "nodejs";

function json(body: unknown, status: number, headers?: Record<string, string>) {
  return Response.json(body, { status, headers });
}

function summary(q: QuoteInput) {
  const f = formulas[q.profile].find((x) => x.id === q.formula)?.name ?? q.formula;
  return [
    `Profil : ${q.profile === "particulier" ? "Particulier" : "Société"}`,
    `Lieu : ${q.type}, ${q.surface} m², ${q.city}`,
    `Fréquence : ${q.frequency}`,
    `Formule : ${f}`,
    `Remarque : ${q.note || "aucune"}`,
    "",
    `Nom : ${q.name}`,
    `Téléphone : ${q.phone}`,
    `Email : ${q.email}`,
  ].join("\n");
}

async function deliver(q: QuoteInput) {
  const to = process.env.CONTACT_EMAIL;
  const key = process.env.RESEND_API_KEY;
  const text = summary(q);
  if (!to || !key) {
    // Pas de service d'email configuré : la demande est journalisée (visible dans les logs Vercel).
    console.log("[quote] CONTACT_EMAIL ou RESEND_API_KEY manquant, demande non envoyée par email :\n" + text);
    return process.env.NODE_ENV !== "production";
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "CheyClean <onboarding@resend.dev>",
      to: [to],
      reply_to: q.email,
      subject: `Nouvelle demande de devis : ${q.name} (${q.city})`,
      text,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  return res.ok;
}

export async function POST(req: Request) {
  const rl = rateLimit(`quote:${clientIp(req)}`, 5, 60 * 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid" }, 400);
  }
  // Honeypot : un robot remplit le champ caché. On répond « ok » sans rien envoyer.
  if (typeof raw === "object" && raw && typeof (raw as { website?: unknown }).website === "string" && (raw as { website: string }).website.length > 0) {
    return json({ ok: true, delai: process.env.DELAI_REPONSE ?? "24 heures" }, 200);
  }
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "invalid", fields: parsed.error.issues.map((i) => i.path[0]) }, 400);
  }
  if (!frequencies.includes(parsed.data.frequency)) return json({ error: "invalid", fields: ["frequency"] }, 400);

  try {
    if (!(await deliver(parsed.data))) return json({ error: "delivery" }, 502);
  } catch {
    return json({ error: "delivery" }, 502);
  }
  return json({ ok: true, delai: process.env.DELAI_REPONSE ?? "24 heures" }, 200);
}
