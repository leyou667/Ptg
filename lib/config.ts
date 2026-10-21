export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cheyclean.be").replace(/\/$/, "");
export const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP ?? "32486374548";

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
