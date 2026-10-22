import { requestSchema } from "@/lib/requests/schema";
import { saveRequest } from "@/lib/requests/store";
import { buildRequestPdf } from "@/lib/pdf/request-summary";
import { emailConfigured, notifyByEmail } from "@/lib/notify";
import { StorageUnavailableError, storageConfigured } from "@/lib/storage";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const json = (body: unknown, status: number, headers?: Record<string, string>) => Response.json(body, { status, headers });

export async function POST(req: Request) {
  const rl = rateLimit(`requests:${clientIp(req)}`, 6, 60 * 60_000);
  if (!rl.ok) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfter) });

  // Aucun canal durable : on refuse franchement plutôt que de faire semblant d'enregistrer.
  if (!storageConfigured() && !emailConfigured()) return json({ error: "storage_unavailable" }, 503);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (raw && typeof raw === "object" && typeof (raw as { website?: unknown }).website === "string" && (raw as { website: string }).website.length > 0) {
    // Honeypot : réponse neutre, rien n'est enregistré.
    return json({ ok: true, reference: "DEV-0000-000000", accessToken: "", delai: process.env.DELAI_REPONSE ?? "24 heures" }, 200);
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "invalid", fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, 400);
  }

  let record;
  try {
    if (!storageConfigured()) throw new StorageUnavailableError();
    record = await saveRequest(parsed.data);
  } catch (e) {
    console.error("[requests] écriture impossible :", e instanceof Error ? e.message : e);
    return json({ error: e instanceof StorageUnavailableError ? "storage_unavailable" : "storage_failed" }, 503);
  }

  // La demande est enregistrée. L'email est un canal en plus : son échec ne perd rien.
  let emailed = false;
  try {
    emailed = await notifyByEmail(record, await buildRequestPdf(record));
  } catch (e) {
    console.error("[requests] notification impossible :", e instanceof Error ? e.message : e);
  }
  return json({ ok: true, reference: record.id, accessToken: record.accessToken, delai: process.env.DELAI_REPONSE ?? "24 heures", emailed }, 201);
}
