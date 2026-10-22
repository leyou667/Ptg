/** Montants en centimes entiers. Saisie tolérante (« 35 », « 35,5 », « 1 234,56 », « 35.50 »), affichage à la belge. */
export const formatCents = (cents: number) => new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(cents / 100);

export function parseEuros(input: string): number | null {
  const s = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export const eurosInput = (cents: number | null) => (cents === null ? "" : (cents / 100).toFixed(2).replace(".", ","));
