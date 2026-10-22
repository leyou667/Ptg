import { z } from "zod";
import { buildRequestPdf } from "@/lib/pdf/request-summary";
import { buildQuotePdf, type QuotePdfModel } from "@/lib/pdf/quote";
import { buyerFromRequest, createDraftQuote, issueQuote, quoteBlockers } from "@/lib/billing/workflow";
import { computeTotals } from "@/lib/billing/totals";
import { loadBillingDeps } from "@/lib/billing/settings";
import type { Quote } from "@/lib/billing/types";
import { findRequest, listRequests, setStatus, statusOf, type RequestStatus, type StoredRequest } from "@/lib/requests/store";
import { ConflictError, NotFoundError, StorageUnavailableError, create, get, list, replace } from "@/lib/storage";
import { QuoteBlockedError } from "@/lib/billing/workflow";

export type RequestRow = {
  request: StoredRequest;
  status: RequestStatus;
  quotes: Quote[];
  /** Dernier devis (le plus récent). */
  lastQuote?: Quote;
};

export async function listRows(): Promise<RequestRow[]> {
  const [requests, quotes] = await Promise.all([listRequests(), list<Quote>("quotes")]);
  const byRequest = new Map<string, Quote[]>();
  for (const q of quotes) byRequest.set(q.requestId, [...(byRequest.get(q.requestId) ?? []), q]);
  return requests.map((request) => {
    const qs = (byRequest.get(request.id) ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { request, status: statusOf(request), quotes: qs, lastQuote: qs[0] };
  });
}

export async function requestWithQuotes(id: string) {
  const request = await findRequest(id);
  if (!request) return null;
  const quotes = (await list<Quote>("quotes")).filter((q) => q.requestId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { request, quotes };
}

/** Crée un brouillon prérempli depuis le questionnaire ; la demande passe « en cours » si elle était nouvelle. */
export async function createQuoteForRequest(request: StoredRequest): Promise<Quote> {
  const deps = await loadBillingDeps();
  const quote = await create<Quote>("quotes", createDraftQuote(request, { validDays: deps.defaultValidDays, quoteTerms: deps.quoteTerms }));
  if (statusOf(request) === "new") await setStatus(request, "in_progress");
  return quote;
}

export async function issueForRequest(quote: Quote): Promise<Quote> {
  const request = await findRequest(quote.requestId);
  if (!request) throw new NotFoundError("La demande liée à ce devis est introuvable.");
  const deps = await loadBillingDeps();
  const issued = await issueQuote(quote, request, deps);
  const fresh = (await findRequest(request.id)) ?? request;
  await setStatus(fresh, "quoted");
  return issued;
}

export async function blockersFor(quote: Quote) {
  const request = await findRequest(quote.requestId);
  if (!request) return ["La demande liée à ce devis est introuvable."];
  const deps = await loadBillingDeps();
  return quote.status === "draft" ? quoteBlockers(quote, request, deps) : [];
}

/** PDF du devis : définitif si le devis est émis, aperçu filigrané pour un brouillon complet. */
export async function quotePdf(quote: Quote): Promise<{ pdf: Uint8Array } | { blockers: string[] }> {
  const request = await findRequest(quote.requestId);
  if (!request) return { blockers: ["La demande liée à ce devis est introuvable."] };
  let model: QuotePdfModel;
  if (quote.status !== "draft" && quote.number && quote.seller && quote.buyer && quote.totals && quote.vatRates) {
    model = {
      draft: false,
      number: quote.number,
      issuedAt: quote.sentAt ?? quote.createdAt,
      validUntil: quote.validUntil,
      validDays: quote.validDays,
      seller: quote.seller,
      buyer: quote.buyer,
      subject: quote.subject,
      lines: quote.lines,
      vatRates: quote.vatRates,
      totals: quote.totals,
      notes: quote.notes,
      terms: quote.quoteTerms ?? "",
      requestId: quote.requestId,
    };
  } else {
    const deps = await loadBillingDeps();
    const blockers = quoteBlockers(quote, request, deps);
    if (blockers.length) return { blockers };
    model = {
      draft: true,
      issuedAt: new Date().toISOString(),
      validDays: quote.validDays,
      seller: deps.seller,
      buyer: buyerFromRequest(request),
      subject: quote.subject,
      lines: quote.lines,
      vatRates: deps.vatRates,
      totals: computeTotals(quote.lines, deps.vatRates),
      notes: quote.notes,
      terms: quote.quoteTerms ?? deps.quoteTerms,
      requestId: quote.requestId,
    };
  }
  return { pdf: await buildQuotePdf(model) };
}

export const requestPdf = (request: StoredRequest) => buildRequestPdf(request);

/* ---------- Réponses d'erreur homogènes ---------- */

export function errorResponse(e: unknown): Response {
  const h = { "cache-control": "no-store" };
  if (e instanceof z.ZodError) {
    return Response.json({ error: "invalid", fields: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400, headers: h });
  }
  if (e instanceof ConflictError) return Response.json({ error: "conflict", message: e.message }, { status: 409, headers: h });
  if (e instanceof NotFoundError) return Response.json({ error: "not_found", message: e.message }, { status: 404, headers: h });
  if (e instanceof QuoteBlockedError) return Response.json({ error: "blocked", blockers: e.blockers }, { status: 409, headers: h });
  if (e instanceof StorageUnavailableError) return Response.json({ error: "storage_unavailable" }, { status: 503, headers: h });
  if (e instanceof Error && /interdite|déjà émis|n'est plus modifiable|expiré/.test(e.message)) {
    return Response.json({ error: "forbidden_transition", message: e.message }, { status: 409, headers: h });
  }
  console.error("[admin] erreur :", e instanceof Error ? e.message : e);
  return Response.json({ error: "server_error" }, { status: 500, headers: h });
}

export { get, replace };
