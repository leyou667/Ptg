/** Contrôle d'un IBAN : longueur plausible et clé de contrôle (modulo 97). Retourne l'IBAN normalisé, ou null. */
export function normalizeIban(input: string): string | null {
  const iban = input.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return null;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let rest = 0;
  for (const ch of rearranged) {
    const v = ch >= "A" ? ch.charCodeAt(0) - 55 : Number(ch);
    rest = Number(`${rest}${v}`) % 97;
  }
  return rest === 1 ? iban.replace(/(.{4})/g, "$1 ").trim() : null;
}
