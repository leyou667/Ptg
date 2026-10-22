/**
 * Numéros d'entreprise / de TVA belges (BCE) : 10 chiffres, les deux derniers sont une clé de contrôle
 * égale à 97 - (les 8 premiers chiffres modulo 97). Les numéros étrangers de l'UE sont acceptés sans contrôle de clé.
 */
export type VatCheck = { ok: true; normalized: string; country: string } | { ok: false };

export function checkVatNumber(input: string): VatCheck {
  const raw = input.replace(/[\s.\-]/g, "").toUpperCase();
  if (!raw) return { ok: false };

  const belgian = /^(BE)?(0?\d{9,10})$/.exec(raw);
  if (belgian) {
    let digits = belgian[2];
    if (digits.length === 9) digits = "0" + digits;
    const base = Number(digits.slice(0, 8));
    const key = Number(digits.slice(8));
    if (97 - (base % 97) !== key) return { ok: false };
    return { ok: true, country: "BE", normalized: `BE ${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}` };
  }

  const foreign = /^([A-Z]{2})([0-9A-Z]{2,12})$/.exec(raw);
  if (foreign && foreign[1] !== "BE") return { ok: true, country: foreign[1], normalized: `${foreign[1]} ${foreign[2]}` };
  return { ok: false };
}
