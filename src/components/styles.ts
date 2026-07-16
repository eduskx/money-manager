// Die gemeinsamen Bausteine des Designs.
//
// Warum eine eigene Datei? Damit eine Kachel auf jeder Seite gleich aussieht
// und eine Änderung an genau einer Stelle reicht. Die Farben stecken auch hier
// nicht drin – nur Rollen (surface, line, accent …), definiert in globals.css.

// Nur Form und Abstände – bewusst OHNE Hintergrund und Rahmenfarbe.
//
// Das ist wichtig: Stünden `bg-surface` (aus einer Basisklasse) und `bg-saldo`
// (aus der Saldo-Kachel) gleichzeitig am selben Element, entschiede NICHT die
// Reihenfolge im className, sondern die im erzeugten Stylesheet. Genau daran
// ist die Saldo-Kachel schon einmal unsichtbar geworden. Deshalb bringt jede
// Kachel ihren Hintergrund selbst mit.
export const tileBase =
  "flex min-w-0 flex-col rounded-2xl border p-4 shadow-sm sm:p-5";

// Die normale Kachel.
export const tile = `${tileBase} border-line bg-surface`;

// Die eine gefüllte Kachel (Saldo). `saldo-scope` definiert die Farb-Rollen im
// Teilbaum um, damit Kind-Komponenten wie EntryRow darauf lesbar bleiben, ohne
// eine Sondervariante zu brauchen.
export const tileAccent = `${tileBase} saldo-scope border-transparent bg-saldo text-on-saldo`;

// Kachel mit randlosem, gefülltem Kopf. Deshalb ohne Innenabstand (den bringen
// Kopf und Inhalt selbst mit) und mit overflow-hidden, damit die Füllung sauber
// in den runden Ecken sitzt.
export const tileFlush =
  "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm";

// Der gefüllte Kopf dazu – dieselbe Farbe wie die Saldo-Kachel. `saldo-scope`
// sorgt dafür, dass Schrift und Icons darin lesbar bleiben.
export const filledHeader =
  "saldo-scope flex min-h-[4.625rem] items-center gap-1 bg-saldo px-3 text-on-saldo";

// Überschrift einer Kachel: klein, gesperrt, zurückgenommen.
export const tileHeading =
  "text-[11px] font-bold uppercase tracking-[0.16em] text-muted";

// Die große Zahl. Einnahmen und Saldo teilen sie sich bewusst.
export const bigNumber =
  "text-[clamp(1.625rem,3.6vw,2.125rem)] font-bold leading-tight tracking-tight tabular-nums";

// Summenzeile am Fuß eines Blocks – sitzt dank mt-auto immer unten.
export const sumRow =
  "mt-auto flex items-baseline justify-between gap-2 border-t-2 border-accent/50 pt-2.5";

// Knopf/Link in einer Kopfzeile (44px Touch-Ziel).
export const headerButton =
  "inline-flex h-11 items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium text-ink transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

// Nur-Icon-Variante davon.
export const headerIconButton =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

// --- Formulare (Profil, Login, Registrierung) ---

// Der Haupt-Knopf: in der Akzentfarbe, Schrift in on-accent.
export const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60";

// Der zurückhaltende Knopf daneben (Abmelden, Zweitweg).
export const secondaryButton =
  "inline-flex h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60";

// Ein echtes Eingabefeld mit sichtbarem Rahmen – anders als die Zeilen im
// Budget, die erst beim Hovern einen bekommen.
export const fieldClass =
  "mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export const labelClass = "block text-sm font-medium text-muted";
