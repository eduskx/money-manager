// Zentrale Logik für die Monatsansicht: Beträge parsen, Summen berechnen und
// Monate aus der Vorlage anlegen (inkl. Saldo-Übertrag aus dem Vormonat).
//
// Wichtig: Diese Datei ist KEIN "use server"-Modul. Sie enthält normale
// Server-seitige Funktionen, die aus Server-Komponenten aufgerufen werden.
// Die vom Client aufrufbaren Mutationen liegen in `src/lib/actions.ts`.

import { Prisma, Section } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Beträge parsen
// ---------------------------------------------------------------------------

// Hinweis: Das Parsen von Betragseingaben (inkl. Rechenformeln wie „=60+30")
// liegt in `src/lib/calc.ts` – das ist client-sicher (ohne Prisma) und wird
// sowohl in den Server-Actions als auch in den Eingabefeldern genutzt.

// ---------------------------------------------------------------------------
// Summen berechnen (die Kernlogik der Excel-Tabelle)
// ---------------------------------------------------------------------------

export type Totals = {
  income: number; // Summe Geldeingang
  fixkosten: number;
  alltag: number;
  luxus: number;
  ausgaben: number; // fixkosten + alltag + luxus
  ruecklagen: number; // Summe der Abzüge unter dem Restbetrag
  restbetrag: number; // income - ausgaben - ruecklagen  (die fette Zahl)
};

export function computeTotals(
  entries: { section: Section; amount: number }[],
): Totals {
  let income = 0;
  let fixkosten = 0;
  let alltag = 0;
  let luxus = 0;
  let ruecklagen = 0;

  for (const e of entries) {
    switch (e.section) {
      case Section.INCOME:
        income += e.amount;
        break;
      case Section.FIXKOSTEN:
        fixkosten += e.amount;
        break;
      case Section.ALLTAG:
        alltag += e.amount;
        break;
      case Section.LUXUS:
        luxus += e.amount;
        break;
      case Section.RUECKLAGE:
        ruecklagen += e.amount;
        break;
    }
  }

  const ausgaben = fixkosten + alltag + luxus;
  const restbetrag = income - ausgaben - ruecklagen;
  return { income, fixkosten, alltag, luxus, ausgaben, ruecklagen, restbetrag };
}

// ---------------------------------------------------------------------------
// Einträge laden (als schlanke, serialisierbare Objekte fürs UI)
// ---------------------------------------------------------------------------

export type EntryView = {
  id: string;
  section: Section;
  label: string;
  amount: number;
  formula: string | null;
};

export type EntriesBySection = Record<Section, EntryView[]>;

function emptyGroups(): EntriesBySection {
  return {
    INCOME: [],
    FIXKOSTEN: [],
    ALLTAG: [],
    LUXUS: [],
    RUECKLAGE: [],
  };
}

/**
 * Lädt alle Einträge eines Monats und gruppiert sie nach Abschnitt.
 * Beträge werden dabei von Prisma-Decimal in `number` gewandelt.
 */
export async function getEntriesBySection(
  monthId: string,
): Promise<EntriesBySection> {
  const rows = await prisma.entry.findMany({
    where: { monthId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const grouped = emptyGroups();
  for (const r of rows) {
    grouped[r.section].push({
      id: r.id,
      section: r.section,
      label: r.label,
      amount: Number(r.amount),
      formula: r.formula,
    });
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Vorlage & Monatsanlage
// ---------------------------------------------------------------------------

/** Genau eine Vorlage pro User – bei Bedarf leer anlegen. */
export async function getOrCreateTemplate(userId: string) {
  const existing = await prisma.month.findFirst({
    where: { userId, isTemplate: true },
  });
  if (existing) return existing;
  return prisma.month.create({ data: { userId, isTemplate: true } });
}

export function previousMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}

// Am weitesten in der Zukunft auswählbarer Monat: genau EIN Monat nach dem
// echten aktuellen Monat (real, nicht der in der App angezeigte).
export function maxSelectableMonth(): { year: number; month: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
}

// true, wenn (year, month) NACH dem Grenz-Monat liegt (also nicht erlaubt).
export function isMonthAfter(
  year: number,
  month: number,
  limit: { year: number; month: number },
): boolean {
  return year > limit.year || (year === limit.year && month > limit.month);
}

// Vorlage-Einträge als Kopier-Vorlage für einen Monat aufbereiten.
function toCopy(
  entries: {
    section: Section;
    label: string;
    amount: Prisma.Decimal;
    formula: string | null;
    position: number;
  }[],
): Prisma.EntryCreateWithoutMonthInput[] {
  return entries.map((e) => ({
    section: e.section,
    label: e.label,
    amount: e.amount,
    formula: e.formula,
    position: e.position,
  }));
}

/**
 * Liefert den Monat (year/month) für einen User. Existiert er noch nicht, wird
 * er beim ersten Öffnen aus der Vorlage materialisiert (reine Kopie der
 * Vorlage-Einträge). Der „Saldo aus Vormonat" wird NICHT gespeichert, sondern
 * dynamisch berechnet (siehe computeChain) – so bleibt er immer aktuell.
 * Idempotent: bei parallelem Anlegen (P2002) wird der Monat erneut gelesen.
 */
export async function getOrCreateMonth(
  userId: string,
  year: number,
  month: number,
) {
  const key = { userId_year_month: { userId, year, month } };

  const existing = await prisma.month.findUnique({ where: key });
  if (existing) return existing;

  const template = await getOrCreateTemplate(userId);
  const templateEntries = await prisma.entry.findMany({
    where: { monthId: template.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  try {
    return await prisma.month.create({
      data: {
        userId,
        year,
        month,
        entries: { create: toCopy(templateEntries) },
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const again = await prisma.month.findUnique({ where: key });
      if (again) return again;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Dynamischer Vormonats-Saldo (berechnet, nicht gespeichert)
// ---------------------------------------------------------------------------

// Das berechnete Ergebnis für einen Monat – inklusive des Übertrags aus dem
// (konsekutiven) Vormonat. Ändert sich ein früherer Monat, ändern sich alle
// folgenden automatisch mit, weil hier immer frisch gerechnet wird.
export type MonthComputation = Totals & {
  carry: number; // Saldo aus Vormonat (fließt in income ein)
  hasPrev: boolean; // gibt es einen direkten Vormonat?
};

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/**
 * Rechnet die Restbeträge einer Monatsreihe der Reihe nach durch und trägt den
 * Restbetrag jeweils als „Saldo aus Vormonat" in den direkt folgenden Monat.
 * Der Übertrag greift nur zwischen KALENDARISCH aufeinanderfolgenden Monaten;
 * bei Lücken beginnt die Kette neu (carry = 0).
 */
export function computeChain(
  months: {
    year: number;
    month: number;
    entries: { section: Section; amount: number }[];
  }[],
): Map<string, MonthComputation> {
  const sorted = [...months].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

  const result = new Map<string, MonthComputation>();
  let prev: { year: number; month: number; restbetrag: number } | null = null;

  for (const m of sorted) {
    const base = computeTotals(m.entries);
    const p = previousMonth(m.year, m.month);
    const previous = prev; // pro Durchlauf festhalten (bricht Typ-Zirkularität)
    const hasPrev: boolean =
      previous !== null && p.year === previous.year && p.month === previous.month;
    const carry: number = previous !== null && hasPrev ? previous.restbetrag : 0;

    const income = base.income + carry;
    const restbetrag = income - base.ausgaben - base.ruecklagen;

    result.set(monthKey(m.year, m.month), {
      ...base,
      income,
      restbetrag,
      carry,
      hasPrev,
    });

    prev = { year: m.year, month: m.month, restbetrag };
  }

  return result;
}

/**
 * Lädt alle echten Monate eines Users und liefert die durchgerechnete Kette.
 * In der Seite danach: `chain.get(monthKey(year, month))`.
 */
export async function loadMonthChain(
  userId: string,
): Promise<Map<string, MonthComputation>> {
  const months = await prisma.month.findMany({
    where: { userId, isTemplate: false, year: { not: null }, month: { not: null } },
    include: { entries: true },
  });

  return computeChain(
    months.map((m) => ({
      year: m.year as number,
      month: m.month as number,
      entries: m.entries.map((e) => ({
        section: e.section,
        amount: Number(e.amount),
      })),
    })),
  );
}

export { monthKey };

// ---------------------------------------------------------------------------
// Vorlage auf Monate anwenden
// ---------------------------------------------------------------------------

/**
 * Regel: Ein Monat, den der Nutzer nie selbst bearbeitet hat
 * (customized = false), spiegelt immer die aktuelle Vorlage. Diese Funktion
 * bringt alle solchen Monate auf den aktuellen Vorlage-Stand – egal ob
 * vergangen, aktuell oder zukünftig. Dadurch werden leere Monate befüllt und
 * unberührte Monate bleiben synchron, auch wenn sich die Vorlage ändert.
 *
 * Bearbeitete Monate (customized = true) werden nie angefasst. Wichtig: echte
 * Monate aus der Zeit vor dem customized-Flag müssen per Migration auf
 * customized = true gesetzt sein, sonst würden sie hier überschrieben.
 */
export async function applyTemplateToMonths(userId: string) {
  const template = await getOrCreateTemplate(userId);
  const templateEntries = await prisma.entry.findMany({
    where: { monthId: template.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const months = await prisma.month.findMany({
    where: { userId, isTemplate: false, customized: false },
    select: { id: true },
  });

  for (const m of months) {
    // Alte (Vorlage-)Einträge weg, aktuelle Vorlage rein – atomar pro Monat.
    await prisma.$transaction([
      prisma.entry.deleteMany({ where: { monthId: m.id } }),
      prisma.entry.createMany({
        data: templateEntries.map((e) => ({
          monthId: m.id,
          section: e.section,
          label: e.label,
          amount: e.amount,
          formula: e.formula,
          position: e.position,
        })),
      }),
    ]);
  }
}
