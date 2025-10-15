export function currencyFormat(n?: number) {
  if (n === undefined) return "-";
  return `$${Number(n).toFixed(2)}`;
}
