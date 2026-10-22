import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import type { BillingParty, QuoteLine, Totals, VatRate } from "@/lib/billing/types";
import type { Seller } from "@/config/company";

const INK = rgb(0.047, 0.165, 0.176);
const SOFT = rgb(0.29, 0.357, 0.361);
const STONE = rgb(0.906, 0.898, 0.875);
const LINE = rgb(0.8, 0.8, 0.78);

export type QuotePdfModel = {
  /** Brouillon : filigrane « APERÇU » et pas de numéro. */
  draft: boolean;
  number?: string;
  issuedAt: string;
  validUntil?: string;
  validDays: number;
  seller: Seller;
  buyer: BillingParty;
  subject: string;
  lines: QuoteLine[];
  vatRates: VatRate[];
  totals: Totals;
  notes: string;
  terms: string;
  requestId: string;
};

const money = (cents: number) => new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(cents / 100);
const qtyFmt = (q: number) => new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 3 }).format(q);
const dateFmt = (iso: string) => new Intl.DateTimeFormat("fr-BE", { dateStyle: "long", timeZone: "Europe/Brussels" }).format(new Date(iso));

function safe(font: PDFFont, text: string) {
  const ok = new Set(font.getCharacterSet());
  return Array.from(text.normalize("NFC"))
    .map((c) => (ok.has(c.codePointAt(0)!) ? c : /[   ]/.test(c) ? " " : "?"))
    .join("");
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const out: string[] = [];
  for (const para of safe(font, text).split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= width) {
        line = test;
        continue;
      }
      if (line) out.push(line);
      let w = word;
      while (font.widthOfTextAtSize(w, size) > width) {
        let cut = w.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
        out.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      line = w;
    }
    out.push(line);
  }
  return out;
}

export async function buildQuotePdf(m: QuotePdfModel): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(m.draft ? "Aperçu de devis" : `Devis ${m.number}`);
  pdf.setAuthor(m.seller.legalName || "CheyClean");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const M = 48;
  const CW = W - M * 2;
  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/images/logo.png")));
  } catch {
    logo = null;
  }

  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const T = (t: string, x: number, size = 10, font = regular, color = INK, yy = y) => page.drawText(safe(font, t), { x, y: yy, size, font, color });
  const right = (t: string, xr: number, size = 10, font = regular, color = INK, yy = y) => {
    const s = safe(font, t);
    page.drawText(s, { x: xr - font.widthOfTextAtSize(s, size), y: yy, size, font, color });
  };

  const COLS = { label: M, qty: M + 262, unit: M + 308, price: M + 405, vat: M + 440, total: M + CW };
  const tableHead = () => {
    page.drawRectangle({ x: M, y: y - 6, width: CW, height: 20, color: STONE });
    T("Désignation", M + 8, 9, bold, INK, y);
    right("Qté", COLS.qty + 20, 9, bold);
    T("Unité", COLS.unit + 4, 9, bold);
    right("PU HT", COLS.price, 9, bold);
    right("TVA", COLS.vat + 16, 9, bold);
    right("Total HT", COLS.total - 6, 9, bold);
    y -= 26;
  };

  const header = (first: boolean) => {
    if (logo) {
      const lh = first ? 40 : 26;
      page.drawImage(logo, { x: M, y: y - lh + 8, width: (logo.width / logo.height) * lh, height: lh });
    }
    if (first) {
      const s = m.seller;
      const lines = [s.legalName + (s.legalForm ? ` (${s.legalForm})` : ""), s.street, `${s.postalCode} ${s.city}`, s.country, `N° d'entreprise / TVA : ${s.vatNumber}`, [s.phone, s.email].filter(Boolean).join("  ")].filter(Boolean);
      lines.forEach((l, i) => right(l, W - M, i === 0 ? 10 : 9, i === 0 ? bold : regular, i === 0 ? INK : SOFT, y - i * 12));
      y -= 86;
    } else {
      right(`${m.draft ? "Aperçu" : `Devis ${m.number}`} (suite)`, W - M, 9, regular, SOFT);
      y -= 44;
    }
  };

  const watermark = (p: PDFPage) => {
    if (!m.draft) return;
    p.drawText("APERÇU", { x: 110, y: 250, size: 120, font: bold, color: rgb(0.92, 0.92, 0.9), rotate: degrees(40), opacity: 0.7 });
  };
  watermark(page);
  header(true);

  const newPage = () => {
    page = pdf.addPage([W, H]);
    watermark(page);
    y = H - M;
    header(false);
  };
  const need = (h: number) => {
    if (y - h < M + 40) newPage();
  };

  // Titre
  T("DEVIS", M, 24, bold);
  right(m.draft ? "Aperçu (non valable)" : `N° ${m.number}`, W - M, 13, bold, INK, y + 2);
  y -= 22;
  right(`Émis le ${dateFmt(m.issuedAt)}`, W - M, 10, regular, SOFT);
  if (m.validUntil) {
    y -= 13;
    right(`Valable jusqu'au ${dateFmt(m.validUntil)}`, W - M, 10, regular, SOFT);
  } else {
    y -= 13;
    right(`Valable ${m.validDays} jours à compter de l'émission`, W - M, 10, regular, SOFT);
  }
  y -= 24;

  // Client
  T("CLIENT", M, 8, bold, SOFT);
  y -= 14;
  const b = m.buyer;
  [b.name, b.contact ? `À l'attention de ${b.contact}` : "", b.street, `${b.postalCode} ${b.city}`, b.country, b.vatNumber ? `N° d'entreprise / TVA : ${b.vatNumber}` : ""]
    .filter(Boolean)
    .forEach((l, i) => {
      T(l, M, i === 0 ? 11 : 10, i === 0 ? bold : regular, i === 0 ? INK : SOFT);
      y -= 13;
    });
  y -= 10;

  // Objet
  T("OBJET", M, 8, bold, SOFT);
  y -= 14;
  for (const l of wrap(regular, m.subject, 11, CW)) {
    T(l, M, 11, bold);
    y -= 14;
  }
  T(`Référence de la demande : ${m.requestId}`, M, 9, regular, SOFT);
  y -= 24;

  // Lignes
  tableHead();
  m.lines.forEach((l, i) => {
    const labelLines = wrap(bold, l.label, 10, COLS.qty - M - 16);
    const descLines = l.description ? wrap(regular, l.description, 8.5, COLS.qty - M - 16) : [];
    const h = labelLines.length * 12 + descLines.length * 11 + 12;
    if (y - h < M + 40) {
      newPage();
      tableHead();
    }
    labelLines.forEach((t, k) => page.drawText(t, { x: M + 8, y: y - k * 12, size: 10, font: bold, color: INK }));
    descLines.forEach((t, k) => page.drawText(t, { x: M + 8, y: y - labelLines.length * 12 - k * 11, size: 8.5, font: regular, color: SOFT }));
    const rate = m.vatRates.find((r) => r.id === l.vatRateId)?.ratePercent ?? 0;
    right(qtyFmt(l.quantity), COLS.qty + 20);
    T(l.unit, COLS.unit + 4);
    right(money(l.unitPriceCents ?? 0), COLS.price);
    right(`${qtyFmt(rate)} %`, COLS.vat + 16);
    right(money(m.totals.lines[i].netCents), COLS.total - 6);
    y -= h;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: M + CW, y: y + 6 }, thickness: 0.5, color: LINE });
  });
  y -= 12;

  // Totaux
  need(40 + m.totals.vatByRate.length * 14);
  const tx = M + CW - 230;
  T("Total hors TVA", tx, 10, regular, SOFT);
  right(money(m.totals.netCents), M + CW, 10, bold);
  y -= 15;
  for (const r of m.totals.vatByRate) {
    T(`TVA ${qtyFmt(r.ratePercent)} % sur ${money(r.baseCents)}`, tx, 9, regular, SOFT);
    right(money(r.vatCents), M + CW, 10);
    y -= 14;
  }
  y -= 4;
  page.drawRectangle({ x: tx - 8, y: y - 8, width: 238 + 8, height: 26, color: INK });
  T("Total TTC", tx, 12, bold, rgb(1, 1, 1), y);
  right(money(m.totals.grossCents), M + CW - 8, 12, bold, rgb(1, 1, 1), y);
  y -= 40;

  // Notes et conditions
  const blocks: [string, string][] = [];
  if (m.notes.trim()) blocks.push(["Remarques", m.notes]);
  if (m.terms.trim()) blocks.push(["Conditions", m.terms]);
  blocks.push(["Validité", `Ce devis est valable ${m.validDays} jours à compter de son émission. Les prix s'entendent en euros.`]);
  for (const [title, text] of blocks) {
    const ls = wrap(regular, text, 9.5, CW);
    need(20 + ls.length * 12);
    T(title.toUpperCase(), M, 8, bold, SOFT);
    y -= 13;
    for (const l of ls) {
      T(l, M, 9.5);
      y -= 12;
    }
    y -= 10;
  }

  // Accord du client
  need(95);
  y -= 6;
  page.drawRectangle({ x: M, y: y - 70, width: CW, height: 78, borderColor: LINE, borderWidth: 0.8 });
  T("Bon pour accord", M + 12, 10, bold, INK, y - 8);
  T("Date, nom et signature du client, précédés de la mention « Bon pour accord » :", M + 12, 8.5, regular, SOFT, y - 22);
  y -= 90;

  // Pied de page
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const s = m.seller;
    const foot = [s.legalName, `TVA ${s.vatNumber}`, s.iban ? `IBAN ${s.iban}` : ""].filter(Boolean).join("   ");
    p.drawText(safe(regular, foot), { x: M, y: 28, size: 8, font: regular, color: SOFT });
    const label = `${i + 1} / ${pages.length}`;
    p.drawText(label, { x: W - M - regular.widthOfTextAtSize(label, 8), y: 28, size: 8, font: regular, color: SOFT });
  });
  return pdf.save();
}
