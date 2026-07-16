import type { Palette } from "@prisma/client";

// Alles rund um die Farbwelten – bewusst client-sicher (kein Prisma-Import zur
// Laufzeit, `import type` verschwindet beim Kompilieren). Damit kann sowohl das
// Server-Layout als auch der PaletteToggle im Browser dieselbe Logik benutzen.
//
// WICHTIG: Hier stehen KEINE Farben. Die liegen ausschließlich in globals.css.
// Hier steht nur, welche Welten es gibt und in welcher Reihenfolge das Icon
// durchschaltet – so gibt es die Farben genau an einer Stelle.

// Reihenfolge des Durchschaltens. Entspricht der Auswahl aus den Entwürfen.
export const PALETTE_ORDER = [
  "GRAPHIT",
  "INDIGO",
  "MARINE",
  "SALBEI",
  "PFLAUME",
  "SAND",
] as const satisfies readonly Palette[];

// Standard für neue Nutzer, für Gäste und für alle, die nie umgeschaltet
// haben (User.palette ist dann null). Auch das Login-Fenster zeigt ihn.
//
// Der Standard steht bewusst NUR hier und nicht als Default in der DB: So
// ändert ein Wechsel hier den Start-Zustand für alle, die nie gewählt haben –
// ohne Migration und ohne jemandem seine Wahl zu überschreiben.
// Gegenstück in globals.css: der :root-Block ohne data-palette.
export const DEFAULT_PALETTE: Palette = "GRAPHIT";

export const PALETTE_LABELS: Record<Palette, string> = {
  GRAPHIT: "Graphit",
  INDIGO: "Indigo",
  MARINE: "Marine",
  SALBEI: "Salbei",
  PFLAUME: "Pflaume",
  SAND: "Sand",
};

// Der Wert, der als data-palette auf <html> landet: "INDIGO" -> "indigo".
// In globals.css hängen daran die Selektoren :root[data-palette="indigo"].
export function paletteAttr(palette: Palette): string {
  return palette.toLowerCase();
}

// Die nächste Welt im Kreis – nach der letzten geht es wieder von vorn los.
export function nextPalette(palette: Palette): Palette {
  const i = PALETTE_ORDER.indexOf(palette);
  // Unbekannter Wert (z. B. alter Cookie): beim Standard neu anfangen.
  if (i === -1) return DEFAULT_PALETTE;
  return PALETTE_ORDER[(i + 1) % PALETTE_ORDER.length];
}

// Type Guard: prüft einen unbekannten String aus dem Formular/der URL.
export function isPalette(value: unknown): value is Palette {
  return (
    typeof value === "string" &&
    (PALETTE_ORDER as readonly string[]).includes(value)
  );
}
