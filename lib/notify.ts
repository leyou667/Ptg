import type { StoredRequest } from "@/lib/requests/store";
import { describeRequest } from "@/lib/requests/describe";

/** Notification par email via Resend (facultatif). Retourne vrai uniquement si le service a accepté le message. */
export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL);
}

export async function notifyByEmail(record: StoredRequest, pdf: Uint8Array): Promise<boolean> {
  if (!emailConfigured()) return false;
  const d = record.data;
  const who = d.profile === "societe" ? `${d.companyName} (${d.contactFirstName} ${d.contactLastName})` : `${d.firstName} ${d.lastName}`;
  const body = [
    `Nouvelle demande de devis ${record.id}`,
    `Reçue le ${record.createdAt}`,
    "",
    ...describeRequest(d).flatMap((g) => [g.title.toUpperCase(), ...g.rows.map(([k, v]) => `${k} : ${v}`), ""]),
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "CheyClean <onboarding@resend.dev>",
        to: [process.env.CONTACT_EMAIL],
        reply_to: d.email,
        subject: `Demande de devis ${record.id} : ${who}`,
        text: body,
        attachments: [{ filename: `demande-${record.id}.pdf`, content: Buffer.from(pdf).toString("base64") }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
