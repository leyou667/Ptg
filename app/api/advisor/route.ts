import { advisorSchema } from "@/lib/schemas";
import { FORMULA_MARKER, systemPrompt } from "@/lib/advisor-prompt";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_USER_TURNS = 6;

function json(body: unknown, status: number, headers?: Record<string, string>) {
  return Response.json(body, { status, headers });
}

/** Retire le marqueur de formule, et retient un marqueur encore incomplet en fin de flux. */
function visibleText(full: string) {
  let out = full.replace(FORMULA_MARKER, "");
  const cut = out.lastIndexOf("<<");
  if (cut !== -1) out = out.slice(0, cut);
  return out.trimEnd();
}

export async function POST(req: Request) {
  const rl = rateLimit(`advisor:${clientIp(req)}`, 20, 10 * 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  let parsed;
  try {
    parsed = advisorSchema.safeParse(await req.json());
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const { messages, profile } = parsed.data;
  if (messages[messages.length - 1].role !== "user") return json({ error: "invalid" }, 400);
  if (messages.filter((m) => m.role === "user").length > MAX_USER_TURNS) return json({ error: "limit" }, 429);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "unavailable" }, 503);

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
        max_tokens: 260,
        stream: true,
        system: systemPrompt(profile),
        // Le texte de l'utilisateur reste dans le rôle « user » : il ne peut pas modifier le rôle système.
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
  if (!upstream.ok || !upstream.body) return json({ error: "unavailable" }, 503);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      let buffer = "";
      let full = "";
      let sent = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const ev of events) {
            const data = ev.split("\n").find((l) => l.startsWith("data: "));
            if (!data) continue;
            let payload: { type?: string; delta?: { type?: string; text?: string } };
            try {
              payload = JSON.parse(data.slice(6));
            } catch {
              continue;
            }
            if (payload.type === "content_block_delta" && payload.delta?.type === "text_delta" && payload.delta.text) {
              full += payload.delta.text;
              const vis = visibleText(full);
              if (vis.length > sent) {
                send({ t: "delta", text: vis.slice(sent) });
                sent = vis.length;
              }
            }
          }
        }
        const finalText = full.replace(FORMULA_MARKER, "").trimEnd();
        if (finalText.length > sent) send({ t: "delta", text: finalText.slice(sent) });
        send({ t: "done", formula: full.match(FORMULA_MARKER)?.[1] ?? null });
      } catch {
        send({ t: "error" });
      } finally {
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
