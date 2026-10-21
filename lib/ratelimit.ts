type Bucket = { count: number; reset: number };
const store = new Map<string, Bucket>();

/**
 * Limitation par IP en mémoire (par instance serverless). Suffisant contre les abus simples ;
 * pour un contrôle global, remplacer par un stockage partagé (ex. Upstash Redis).
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (store.size > 5000) {
    for (const [k, b] of store) if (b.reset < now) store.delete(k);
  }
  const b = store.get(key);
  if (!b || b.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
