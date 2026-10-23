import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { frequencies, type FormulaId } from "@/content/fr";
import { conseilSystemPrompt, conseilUserMessage } from "@/lib/conseil-prompt";
import { fallbackAdvice, fallbackFormula, formulaIds, isValidAnswers, lieuOptions, surfaceIds, type Answers } from "@/lib/qualifier";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 15;

/** Au-delà, on ne fait pas attendre le visiteur : les règles simples répondent. */
const AI_TIMEOUT_MS = 8000;

const body = z.object({
  profile: z.enum(["particulier", "societe"]),
  lieu: z.string().max(40),
  surface: z.string().max(4),
  frequence: z.string().max(40),
});

const answerSchema = z.object({ formule: z.string(), conseil: z.string() });

const json = (data: unknown, status = 200, headers?: Record<string, string>) => Response.json(data, { status, headers: { "cache-control": "no-store", ...headers } });

/** Un conseil acceptable : 3 phrases au plus, court, sans montant ni prix. */
function cleanAdvice(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t.length > 520) return null;
  if (/[€$£]|\beuros?\b|\beur\b|\d\s?(€|e\b)|\b(tarif|prix)\s+(de|à|d'environ)\s+\d|\bfourchette\b|\bgratuit\b.*\d+\s?%|\d+\s?%/i.test(t)) return null;
  if (/[*#`_]{2,}|^\s*[-•]/.test(t)) return null;
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length <= 3 ? t : null;
}

function parseModel(raw: string, ids: FormulaId[]): { formule: FormulaId; conseil: string } | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const j = answerSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
    if (!j.success || !(ids as string[]).includes(j.data.formule)) return null;
    const conseil = cleanAdvice(j.data.conseil);
    return conseil ? { formule: j.data.formule as FormulaId, conseil } : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const rl = rateLimit(`conseil:${clientIp(req)}`, 20, 10 * 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  let parsed;
  try {
    parsed = body.safeParse(await req.json());
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { profile, ...answers } = parsed.data;
  const a: Answers = { lieu: answers.lieu, surface: answers.surface, frequence: answers.frequence };
  // Seules des valeurs des listes du site passent : rien de libre n'atteint le modèle.
  if (!isValidAnswers(profile, a) || !lieuOptions(profile).includes(a.lieu) || !surfaceIds(profile).includes(a.surface) || !(frequencies as string[]).includes(a.frequence)) {
    return json({ error: "invalid" }, 400);
  }

  const rules = () => {
    const formule = fallbackFormula(profile, a);
    return json({ formule, conseil: fallbackAdvice(profile, formule, a), source: "regles" });
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return rules();

  try {
    const client = new Anthropic({ apiKey, maxRetries: 0, timeout: AI_TIMEOUT_MS });
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
      max_tokens: 260,
      system: conseilSystemPrompt(profile),
      messages: [{ role: "user", content: conseilUserMessage(profile, a) }],
    });
    const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const out = parseModel(text, formulaIds(profile));
    return out ? json({ ...out, source: "ia" }) : rules();
  } catch {
    // Clé refusée, quota, lenteur, panne : le visiteur reçoit quand même une recommandation.
    return rules();
  }
}
