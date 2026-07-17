// Zentrale Logik für die Monatsansicht: Beträge parsen, Summen berechnen und
// Monate aus der Vorlage anlegen (inkl. Saldo-Übertrag aus dem Vormonat).
//
// Wichtig: Diese Datei ist KEIN "use server"-Modul. Sie enthält normale
// Server-seitige Funktionen, die aus Server-Komponenten aufgerufen werden.
// Die vom Client aufrufbaren Mutationen liegen in `src/lib/actions.ts`.

import { randomUUID } from "node:crypto";

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
  income: number; // Summe Einnahmen
  ausgaben: number; // Summe über alle Ausgaben-Spalten
  ruecklagen: number; // Summe der Abzüge unter dem Saldo
  restbetrag: number; // income - ausgaben - ruecklagen  (die fette Zahl)
};

// Die Summen je Ausgaben-Spalte stehen in der MonthView (siehe loadMonthView);
// hier interessiert nur die Gesamtsumme aller Ausgaben.
export function computeTotals(
  entries: { section: Section; amount: number }[],
): Totals {
  let income = 0;
  let ausgaben = 0;
  let ruecklagen = 0;

  for (const e of entries) {
    switch (e.section) {
      case Section.INCOME:
        income += e.amount;
        break;
      case Section.EXPENSE:
        ausgaben += e.amount;
        break;
      case Section.RUECKLAGE:
        ruecklagen += e.amount;
        break;
    }
  }

  const restbetrag = income - ausgaben - ruecklagen;
  return { income, ausgaben, ruecklagen, restbetrag };
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

export type ColumnView = {
  id: string;
  name: string;
  position: number;
  entries: EntryView[];
};

// Ein Monat (oder die Vorlage) fürs UI: zwei feste Blöcke plus die frei
// benennbaren Ausgaben-Spalten.
export type MonthView = {
  income: EntryView[];
  ruecklagen: EntryView[];
  columns: ColumnView[];
};

/** Höchstzahl an Ausgaben-Spalten je Monat/Vorlage. */
export const MAX_EXPENSE_COLUMNS = 5;

/**
 * Lädt Einträge und Ausgaben-Spalten eines Monats und baut daraus die
 * Ansicht. Beträge werden dabei von Prisma-Decimal in `number` gewandelt.
 */
export async function loadMonthView(monthId: string): Promise<MonthView> {
  const [rows, columns] = await Promise.all([
    prisma.entry.findMany({
      where: { monthId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    prisma.expenseColumn.findMany({
      where: { monthId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const view: MonthView = {
    income: [],
    ruecklagen: [],
    columns: columns.map((c) => ({
      id: c.id,
      name: c.name,
      position: c.position,
      entries: [],
    })),
  };

  const byColumn = new Map(view.columns.map((c) => [c.id, c]));

  for (const r of rows) {
    const entry: EntryView = {
      id: r.id,
      section: r.section,
      label: r.label,
      amount: Number(r.amount),
      formula: r.formula,
    };
    if (r.section === Section.INCOME) view.income.push(entry);
    else if (r.section === Section.RUECKLAGE) view.ruecklagen.push(entry);
    else if (r.columnId) byColumn.get(r.columnId)?.entries.push(entry);
  }

  return view;
}

/** Alle Einträge einer Ansicht flach – praktisch für computeTotals. */
export function flattenEntries(view: MonthView): EntryView[] {
  return [
    ...view.income,
    ...view.ruecklagen,
    ...view.columns.flatMap((c) => c.entries),
  ];
}

// ---------------------------------------------------------------------------
// Vorlage & Monatsanlage
// ---------------------------------------------------------------------------

/**
 * Genau eine Vorlage pro User – bei Bedarf anlegen. Eine frische Vorlage
 * startet mit genau einer Ausgaben-Spalte („Fixkosten"); weitere legt der
 * Nutzer selbst an.
 */
export async function getOrCreateTemplate(userId: string) {
  const existing = await prisma.month.findFirst({
    where: { userId, isTemplate: true },
  });
  if (existing) return existing;
  return prisma.month.create({
    data: {
      userId,
      isTemplate: true,
      columns: { create: [{ name: "Fixkosten", position: 0 }] },
    },
  });
}

export function previousMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}

// Am weitesten in der Zukunft auswählbarer Monat: genau EIN Monat nach dem
// echten aktuellen Monat (real, nicht der in der App angezeigte).
// Am weitesten wählbarer Monat = der FOLGEMONAT (aktueller Monat + 1). Im Juli
// also bis August; im Dezember der Januar des nächsten Jahres (dort springt
// die Grenze bewusst über den Jahreswechsel).
export function maxSelectableMonth(): { year: number; month: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1..12
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

// Vorlage laden: Spalten + Einträge, beides in Anzeigereihenfolge.
async function loadTemplateContent(templateId: string) {
  return Promise.all([
    prisma.expenseColumn.findMany({
      where: { monthId: templateId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    prisma.entry.findMany({
      where: { monthId: templateId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
  ]);
}

type TemplateColumn = { id: string; name: string; position: number };
type TemplateEntry = {
  section: Section;
  label: string;
  amount: Prisma.Decimal;
  formula: string | null;
  position: number;
  columnId: string | null;
};

/**
 * Baut die Kopier-Daten für einen Ziel-Monat: neue Spalten (mit eigenen IDs)
 * und die Einträge, deren columnId auf die neue Spalte zeigt. Die Zuordnung
 * läuft über `position` – die ist je Monat eindeutig.
 */
function buildCopy(
  targetMonthId: string,
  templateColumns: TemplateColumn[],
  templateEntries: TemplateEntry[],
) {
  const columns = templateColumns.map((c) => ({
    id: randomUUID(),
    monthId: targetMonthId,
    name: c.name,
    position: c.position,
  }));

  const newIdByPosition = new Map(columns.map((c) => [c.position, c.id]));
  const positionByTemplateId = new Map(
    templateColumns.map((c) => [c.id, c.position]),
  );

  const entries = templateEntries.map((e) => {
    const pos = e.columnId != null ? positionByTemplateId.get(e.columnId) : undefined;
    return {
      monthId: targetMonthId,
      section: e.section,
      label: e.label,
      amount: e.amount,
      formula: e.formula,
      position: e.position,
      columnId: pos != null ? (newIdByPosition.get(pos) ?? null) : null,
    };
  });

  return { columns, entries };
}

/**
 * Liefert den Monat (year/month) für einen User – oder null, wenn er noch
 * nicht erzeugt wurde. Bewusst OHNE automatisches Anlegen: Ein Monat entsteht
 * erst, wenn der Nutzer im Dashboard auf „Vorlage importieren" klickt. Bloßes
 * Durchblättern legt nichts mehr an.
 */
export async function getMonth(userId: string, year: number, month: number) {
  return prisma.month.findUnique({
    where: { userId_year_month: { userId, year, month } },
  });
}

/**
 * „Vorlage importieren": Erzeugt den Monat (year/month) aus der Vorlage –
 * inklusive der Ausgaben-Spalten. Existiert er schon (z. B. Doppelklick auf
 * den Import-Knopf), wird er unverändert zurückgegeben.
 *
 * Der „Vormonat"-Übertrag wird NICHT gespeichert, sondern dynamisch berechnet
 * (siehe computeChain) – so bleibt er immer aktuell.
 * Idempotent: bei parallelem Anlegen (P2002) wird der Monat erneut gelesen.
 */
export async function importMonthFromTemplate(
  userId: string,
  year: number,
  month: number,
) {
  const key = { userId_year_month: { userId, year, month } };

  const existing = await prisma.month.findUnique({ where: key });
  if (existing) return existing;

  const template = await getOrCreateTemplate(userId);
  const [templateColumns, templateEntries] = await loadTemplateContent(
    template.id,
  );

  try {
    // Alles in einer Transaktion: entweder ganzer Monat oder gar keiner.
    return await prisma.$transaction(async (tx) => {
      const created = await tx.month.create({ data: { userId, year, month } });
      const copy = buildCopy(created.id, templateColumns, templateEntries);

      if (copy.columns.length > 0) {
        await tx.expenseColumn.createMany({ data: copy.columns });
      }
      if (copy.entries.length > 0) {
        await tx.entry.createMany({ data: copy.entries });
      }
      return created;
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
// letzten vorhandenen Monat davor. Ändert sich ein früherer Monat, ändern sich
// alle folgenden automatisch mit, weil hier immer frisch gerechnet wird.
export type MonthComputation = Totals & {
  carry: number; // Übertrag (fließt in income ein)
  hasPrev: boolean; // gibt es irgendeinen früheren Monat, aus dem er kommt?
  // Aus welchem Monat der Übertrag stammt. Wichtig für die Anzeige: Ist es
  // NICHT der direkte Kalender-Vormonat (Lücke!), soll die Zeile das sagen –
  // sonst steht da „Vormonat" mit einer Zahl aus einem ganz anderen Monat.
  carryFrom: { year: number; month: number } | null;
};

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/**
 * Rechnet die Restbeträge einer Monatsreihe der Reihe nach durch und trägt den
 * Restbetrag jeweils in den nächsten VORHANDENEN Monat. Lücken werden
 * übersprungen: Ist der Februar gelöscht, fließt der Januar-Rest in den März.
 * Nichts geht verloren, nur weil ein Monat dazwischen fehlt – seit Monate nur
 * noch per „Vorlage importieren" entstehen, sind Lücken der Normalfall.
 *
 * `carryOver = false`: Der Nutzer hat den Übertrag abgeschaltet – dann steht
 * jeder Monat für sich. Der Schalter greift bewusst HIER und nicht erst in der
 * Anzeige: Sonst würde die Zeile zwar verschwinden, der Übertrag aber weiter
 * in income und restbetrag stecken, und die Zahlen wären falsch.
 */
export function computeChain(
  months: {
    year: number;
    month: number;
    entries: { section: Section; amount: number }[];
  }[],
  carryOver = true,
): Map<string, MonthComputation> {
  const sorted = [...months].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );

  const result = new Map<string, MonthComputation>();
  let prev: { year: number; month: number; restbetrag: number } | null = null;

  for (const m of sorted) {
    const base = computeTotals(m.entries);
    const previous = prev; // pro Durchlauf festhalten (bricht Typ-Zirkularität)
    const hasPrev: boolean = carryOver && previous !== null;
    const carry: number = hasPrev && previous !== null ? previous.restbetrag : 0;

    const income = base.income + carry;
    const restbetrag = income - base.ausgaben - base.ruecklagen;

    result.set(monthKey(m.year, m.month), {
      ...base,
      income,
      restbetrag,
      carry,
      hasPrev,
      carryFrom:
        hasPrev && previous !== null
          ? { year: previous.year, month: previous.month }
          : null,
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
  carryOver = true,
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
    carryOver,
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

  // Die Vorlage laden und die betroffenen Monate suchen – beides weiß nichts
  // voneinander, also nebeneinander.
  const [[templateColumns, templateEntries], months] = await Promise.all([
    loadTemplateContent(template.id),
    prisma.month.findMany({
      where: { userId, isTemplate: false, customized: false },
      select: { id: true },
    }),
  ]);

  if (months.length === 0) return;

  // Alle Monate auf einmal statt einer nach dem anderen.
  //
  // Vorher lief hier eine Schleife mit einer eigenen Transaktion PRO Monat –
  // vier Rundreisen zur DB je Monat, nacheinander. Bei 3 Monaten ging das noch,
  // bei 12 wurde daraus eine spürbare Pause auf der Vorlagen-Seite. Jetzt sind
  // es vier Rundreisen INSGESAMT, egal wie viele Monate es sind.
  //
  // Möglich ist das, weil `buildCopy` die Spalten-IDs selbst erzeugt: Wir
  // kennen sie also schon, bevor irgendetwas geschrieben ist, und können die
  // Einträge aller Monate direkt darauf zeigen lassen.
  const monthIds = months.map((m) => m.id);
  const copies = months.map((m) =>
    buildCopy(m.id, templateColumns, templateEntries),
  );
  const allColumns = copies.flatMap((c) => c.columns);
  const allEntries = copies.flatMap((c) => c.entries);

  // Eine Transaktion für alles: Entweder spiegeln am Ende ALLE unberührten
  // Monate die Vorlage, oder es ändert sich gar nichts. Ein halb angewendeter
  // Sync wäre schlimmer als keiner.
  await prisma.$transaction(async (tx) => {
    // Einträge zuerst: Sie hängen per Fremdschlüssel an den Spalten.
    await tx.entry.deleteMany({ where: { monthId: { in: monthIds } } });
    await tx.expenseColumn.deleteMany({ where: { monthId: { in: monthIds } } });

    if (allColumns.length > 0) {
      await tx.expenseColumn.createMany({ data: allColumns });
    }
    if (allEntries.length > 0) {
      await tx.entry.createMany({ data: allEntries });
    }
  });
}
