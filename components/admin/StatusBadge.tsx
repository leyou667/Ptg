import { quoteStatusLabel, requestStatusLabel } from "@/content/admin";
import type { QuoteStatus } from "@/lib/billing/types";
import type { RequestStatus } from "@/lib/requests/store";

const request: Record<RequestStatus, string> = {
  new: "bg-cyan text-ink",
  in_progress: "bg-ink text-white",
  quoted: "bg-white text-ink outline outline-2 outline-ink",
  archived: "bg-stone text-ink-soft",
};
const quote: Record<QuoteStatus, string> = {
  draft: "bg-stone text-ink",
  sent: "bg-ink text-white",
  accepted: "bg-cyan text-ink",
  declined: "bg-stone text-ink-soft",
  expired: "bg-stone text-ink-soft",
};

const base = "inline-flex items-center rounded-full px-3 py-1 text-[0.8125rem] font-semibold leading-none whitespace-nowrap";

export const RequestBadge = ({ status }: { status: RequestStatus }) => <span className={`${base} ${request[status]}`}>{requestStatusLabel[status]}</span>;
export const QuoteBadge = ({ status }: { status: QuoteStatus }) => <span className={`${base} ${quote[status]}`}>{quoteStatusLabel[status]}</span>;
