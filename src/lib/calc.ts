// Betrags-Eingaben auswerten – inkl. kleiner Rechenformeln wie in Excel.
//
// Dieses Modul importiert bewusst KEIN Prisma, damit es sowohl auf dem Server
// (in den Server-Actions) als auch im Client (in den Eingabefeldern) genutzt
// werden kann.
//
// Beispiele:
//   "1.730,87"   -> 1730.87   (deutsche Betragseingabe)
//   "=60+30"     -> 90        (Formel, führendes "=" wie in Excel)
//   "60+30"      -> 90        (Formel auch ohne "=", wenn Operatoren drin sind)
//   "100/4"      -> 25
//   "(60+40)*2"  -> 200
//   "-50"        -> -50       (führendes Minus = negativer Betrag, keine Formel)

/**
 * Erkennt, ob eine Eingabe eine Rechenformel ist: führendes "=" ODER ein
 * Rechenoperator (+, *, /) ODER ein Minus zwischen zwei Zahlen ("60-20"). Ein
 * führendes Minus zählt NICHT als Formel – das ist ein negativer Betrag.
 */
export function isFormulaInput(raw: string): boolean {
  const trimmed = raw.replace(/€/g, "").trim();
  return (
    trimmed.startsWith("=") ||
    /[+*/]/.test(trimmed) ||
    /\d\s*-\s*\d/.test(trimmed)
  );
}

/**
 * Liest eine Betrags-Eingabe als Paar { amount, formula }.
 *
 * `amount` versteht Punkt UND Komma als Cent-Trenner („60.50" wie „60,50").
 * `formula` (nur wenn gerechnet wurde) wird beim Speichern auf Komma
 * vereinheitlicht – so sieht man beim erneuten Fokussieren überall dieselbe
 * Schreibweise, egal was getippt wurde. Ausgewertet wird die Formel trotzdem
 * korrekt, weil evaluateExpression Komma wieder zu Punkt macht.
 *
 * Ein Ort für alle vier Betrags-Actions (Budget + Sparkonten), damit die
 * Regel nicht auseinanderläuft.
 */
export function readAmountInput(raw: string): {
  amount: number | null;
  formula: string | null;
} {
  return {
    amount: parseAmount(raw),
    formula: isFormulaInput(raw) ? raw.trim().replace(/\./g, ",") : null,
  };
}

/**
 * Wandelt eine Freitext-Eingabe in eine Zahl. Erkennt automatisch Formeln.
 * Gibt `null` zurück, wenn nichts Sinnvolles ausgewertet werden kann.
 */
export function parseAmount(raw: string): number | null {
  const trimmed = raw.replace(/€/g, "").trim();
  if (!trimmed) return null;

  const value = isFormulaInput(trimmed)
    ? evaluateExpression(trimmed.replace(/^=/, ""))
    : parsePlainAmount(trimmed);

  if (value === null || !Number.isFinite(value)) return null;
  // Auf zwei Nachkommastellen runden – passend zu Decimal(12,2).
  return Math.round(value * 100) / 100;
}

// Normale deutsche Betragseingabe ohne Rechenoperationen.
function parsePlainAmount(cleaned: string): number | null {
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;
  if (hasComma && hasDot) {
    // "1.730,87" -> Punkte sind Tausendertrenner, Komma ist Dezimaltrenner
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // "60,00" -> "60.00"
    normalized = cleaned.replace(",", ".");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// Sicherer Ausdrucks-Auswerter (KEIN eval): +, -, *, /, Klammern, Vorzeichen.
// In Formeln gilt das Komma als Dezimaltrennzeichen (deutsche Eingabe).
function evaluateExpression(input: string): number | null {
  const src = input.replace(/,/g, ".").replace(/\s+/g, "");
  if (!src) return null;

  let pos = 0;
  const peek = () => src[pos];

  const NUMBER = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

  function parseNumber(): number | null {
    const start = pos;
    while (pos < src.length && /[0-9.]/.test(src[pos])) pos++;
    const slice = src.slice(start, pos);
    if (!NUMBER.test(slice)) return null;
    const n = Number(slice);
    return Number.isFinite(n) ? n : null;
  }

  function parseFactor(): number | null {
    if (peek() === "+") {
      pos++;
      return parseFactor();
    }
    if (peek() === "-") {
      pos++;
      const f = parseFactor();
      return f === null ? null : -f;
    }
    if (peek() === "(") {
      pos++;
      const inner = parseExpr();
      if (peek() !== ")") return null;
      pos++;
      return inner;
    }
    return parseNumber();
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = src[pos++];
      const right = parseFactor();
      if (right === null) return null;
      if (op === "/") {
        if (right === 0) return null; // Division durch 0 -> ungültig
        left /= right;
      } else {
        left *= right;
      }
    }
    return left;
  }

  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = src[pos++];
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const result = parseExpr();
  // Wurde nicht der ganze String verbraucht, war die Formel ungültig.
  if (result === null || pos !== src.length) return null;
  return result;
}
