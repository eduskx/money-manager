// Gemeinsame Formatierungs-Helfer für Beträge (de-DE / Euro).

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** Zahl als Euro-Betrag, z. B. 675.9 -> "675,90 €". */
export function formatEuro(value: number): string {
  return euroFormatter.format(value);
}

/** Zahl ohne Währungssymbol fürs Eingabefeld, z. B. 451 -> "451,00". */
export function formatAmountInput(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
