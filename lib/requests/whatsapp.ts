import { site } from "@/content/fr";
import { describeRequest } from "./describe";
import type { RequestFields } from "./schema";

const MAX_VALUE = 500;

/**
 * Message WhatsApp prérempli : toutes les réponses du client, dans l'ordre du récapitulatif.
 * Même description que l'écran, le PDF et l'email (describeRequest), donc jamais d'écart.
 * Le client doit encore appuyer sur « Envoyer » dans WhatsApp : rien n'est transmis avant.
 */
export function buildWhatsappMessage(data: RequestFields, reference?: string): string {
  const lines: string[] = [site.whatsappGreeting];
  if (reference) lines.push(`Référence : ${reference}`);
  for (const g of describeRequest(data)) {
    lines.push("", `*${g.title}*`);
    for (const [label, value] of g.rows) {
      const v = value.length > MAX_VALUE ? `${value.slice(0, MAX_VALUE).trimEnd()}…` : value;
      lines.push(`${label} : ${v}`);
    }
  }
  return lines.join("\n");
}
