import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { assistantPrompt, QUOTE_MARKER } from "@/lib/assistant-prompt";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_USER_TURNS = 8;
const MAX_CHARS = 600;

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(MAX_CHARS * 2) }))
    .min(1)
    .max(17), // 8 questions du visiteur, 8 réponses, plus une pour la limite
});

const json = (body: unknown, status: number, headers?: Record<string, string>) => Response.json(body, { status, headers });

/** Retire le marqueur du texte déjà envoyé au visiteur : il est transmis à part, en fin de flux. */
const MARKER_START = "<<";

export async function POST(req: Request) {
  const rl = rateLimit(`assistant:${clientIp(req)}`, 30, 10 * 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  let parsed;
  try {
    parsed = schema.safeParse(await req.json());
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { messages } = parsed.data;
  if (messages[messages.length - 1].role !== "user") return json({ error: "invalid" }, 400);
  if (messages.filter((m) => m.role === "user").some((m) => m.content.length > MAX_CHARS)) return json({ error: "invalid" }, 400);
  if (messages.filter((m) => m.role === "user").length > MAX_USER_TURNS) return json({ error: "limit" }, 429);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "unavailable" }, 503);

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 25_000 });
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      let sent = 0; // nombre de caractères déjà envoyés au visiteur
      const flush = (final: boolean) => {
        // On ne laisse jamais partir un marqueur, même coupé en deux entre deux morceaux.
        const cut = full.indexOf(MARKER_START);
        const hold = !final && full.endsWith("<") ? 1 : 0; // un « < » seul peut être le début d'un marqueur
        const safeEnd = cut === -1 ? full.length - hold : cut;
        const text = full.slice(sent, safeEnd);
        if (text) controller.enqueue(encoder.encode(text));
        sent = Math.max(sent, safeEnd);
      };
      try {
        const stream = client.messages.stream({
          model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
          max_tokens: 320,
          system: assistantPrompt(),
          // Le texte du visiteur reste dans le rôle « user » : il ne peut pas modifier le rôle système.
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
        stream.on("text", (delta) => {
          full += delta;
          flush(false);
        });
        await stream.finalMessage();
        flush(true);
        const m = QUOTE_MARKER.exec(full);
        // Fin de flux : une dernière ligne « \u0001profil:formule » que le client lit et n'affiche pas.
        if (m) controller.enqueue(encoder.encode(`\u0001${m[1]}:${m[2]}`));
        controller.close();
      } catch {
        // Erreur en cours de route : on termine proprement, le client affiche son message d'indisponibilité s'il n'a rien reçu.
        controller.error(new Error("upstream"));
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
