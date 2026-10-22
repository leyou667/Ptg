import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { describeRequest } from "@/lib/requests/describe";
import type { StoredRequest } from "@/lib/requests/store";
import { site } from "@/content/fr";
import { flow } from "@/content/questionnaire";

const INK = rgb(0.047, 0.165, 0.176);
const SOFT = rgb(0.29, 0.357, 0.361);
const STONE = rgb(0.906, 0.898, 0.875);

/** Ne garde que les caractères que la police standard sait écrire (WinAnsi) ; le reste devient « ? ». */
function safe(font: PDFFont, text: string) {
  const ok = new Set(font.getCharacterSet());
  return Array.from(text.normalize("NFC"))
    .map((c) => (ok.has(c.codePointAt(0)!) ? c : c === " " || c === " " ? " " : "?"))
    .join("");
}

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= width) line = test;
      else {
        if (line) lines.push(line);
        // mot plus long que la ligne : on le coupe
        let w = word;
        while (font.widthOfTextAtSize(w, size) > width) {
          let cut = w.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
          lines.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        line = w;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Récapitulatif PDF d'une demande de devis. Il ne contient aucun prix, aucun total, aucun numéro de facture :
 * ce n'est ni un devis ni une facture.
 */
export async function buildRequestPdf(record: StoredRequest): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Demande de devis ${record.id}`);
  pdf.setAuthor("CheyClean");
  pdf.setCreationDate(new Date(record.createdAt));
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const M = 48;
  const contentW = W - M * 2;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
  try {
    logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public/images/logo.png")));
  } catch {
    logo = null;
  }

  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
  };
  const need = (h: number) => {
    if (y - h < M + 30) newPage();
  };
  const text = (t: string, x: number, size: number, font: PDFFont, color = INK) => {
    page.drawText(safe(font, t), { x, y, size, font, color });
  };

  // En-tête
  if (logo) {
    const lh = 38;
    const lw = (logo.width / logo.height) * lh;
    page.drawImage(logo, { x: M, y: y - lh + 6, width: lw, height: lh });
  } else {
    text("CheyClean", M, 22, bold);
  }
  const created = new Date(record.createdAt);
  const date = new Intl.DateTimeFormat("fr-BE", { dateStyle: "long", timeZone: "Europe/Brussels" }).format(created);
  const refLabel = `Référence ${record.id}`;
  page.drawText(safe(bold, refLabel), { x: W - M - bold.widthOfTextAtSize(safe(bold, refLabel), 11), y: y - 10, size: 11, font: bold, color: INK });
  page.drawText(safe(regular, date), { x: W - M - regular.widthOfTextAtSize(safe(regular, date), 10), y: y - 26, size: 10, font: regular, color: SOFT });
  y -= 70;

  const title = "Récapitulatif de votre demande de devis";
  text(title, M, 20, bold);
  y -= 26;
  const subtitle = record.data.profile === "societe" ? "Demande d'une société" : "Demande d'un particulier";
  text(subtitle, M, 11, regular, SOFT);
  y -= 30;

  for (const group of describeRequest(record.data)) {
    need(60);
    page.drawRectangle({ x: M, y: y - 6, width: contentW, height: 22, color: STONE });
    text(group.title, M + 10, 11, bold);
    y -= 30;
    for (const [label, value] of group.rows) {
      const lines = wrap(regular, safe(regular, value), 11, contentW - 170);
      need(lines.length * 15 + 8);
      text(label, M + 10, 10, regular, SOFT);
      lines.forEach((l, i) => {
        page.drawText(l, { x: M + 170, y: y - i * 15, size: 11, font: regular, color: INK });
      });
      y -= Math.max(1, lines.length) * 15 + 6;
    }
    y -= 10;
  }

  need(90);
  y -= 6;
  const note = wrap(
    regular,
    safe(regular, "Ce document résume votre demande. Ce n'est ni un devis ni une facture : aucun prix n'est fixé à ce stade. CheyClean vous répondra avec un devis détaillé."),
    10,
    contentW,
  );
  note.forEach((l, i) => page.drawText(l, { x: M, y: y - i * 14, size: 10, font: regular, color: SOFT }));
  y -= note.length * 14 + 14;
  text(`${site.name}  ${site.phoneDisplay}`, M, 10, bold);

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const label = `${flow.groups.contact ? "" : ""}${i + 1} / ${pages.length}`;
    p.drawText(label, { x: W - M - regular.widthOfTextAtSize(label, 9), y: 28, size: 9, font: regular, color: SOFT });
  });
  return pdf.save();
}
