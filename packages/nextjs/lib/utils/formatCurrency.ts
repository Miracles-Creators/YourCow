/**
 * Format a centavo amount (1/100 of currency unit) for display.
 * For ARS: formats as Argentine peso with Intl.NumberFormat.
 * For STRK: returns raw value (STRK formatting handled separately via formatStrkWei).
 */
export function formatCurrency(
  centavos: number,
  currency: string,
  locale = "es-AR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}
