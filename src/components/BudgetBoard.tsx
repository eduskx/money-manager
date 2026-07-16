import { MAX_EXPENSE_COLUMNS, type MonthView, type Totals } from "@/lib/month";
import { formatEuro } from "@/lib/format";
import { BudgetColumn } from "@/components/BudgetColumn";
import { AddExpenseColumn } from "@/components/AddExpenseColumn";

function sumOf(entries: { amount: number }[]): number {
  return entries.reduce((total, e) => total + e.amount, 0);
}

// Die drei Excel-Blöcke (Einnahmen | Ausgaben | Saldo). Wird sowohl für einen
// echten Monat als auch für die Vorlage benutzt – der Aufbau ist gleich, nur
// der Rahmen drumherum (Kopfzeile, Monatswechsel) unterscheidet sich.
//
// Die Ausgaben-Spalten kommen aus `view.columns`: frei benennbar, bis zu
// MAX_EXPENSE_COLUMNS Stück.
//
// `carry`: der berechnete Übertrag aus dem Vormonat. `null` bei der Vorlage
// (dort gibt es keinen Vormonat) – dann wird die Zeile nicht angezeigt. Die in
// `totals` übergebenen income/restbetrag enthalten den Übertrag bereits.
export function BudgetBoard({
  monthId,
  view,
  totals,
  carry = null,
}: {
  monthId: string;
  view: MonthView;
  totals: Totals;
  carry?: number | null;
}) {
  const verfuegbar = totals.income - totals.ausgaben; // vor Abzügen/Rücklagen
  const restPositive = totals.restbetrag >= 0;

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
      {/* --- Einnahmen --- */}
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:w-64 xl:shrink-0">
        <header className="rounded-t-2xl bg-emerald-100 px-4 py-3 text-center dark:bg-emerald-900/40">
          <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-900 dark:text-emerald-200">
            Einnahmen
          </h2>
        </header>
        <div className="p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-950/30">
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Gesamt
            </span>
            <span className="text-xl font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
              {formatEuro(totals.income)}
            </span>
          </div>

          {/* Berechneter Übertrag aus dem Vormonat – nicht editierbar. */}
          {carry !== null && (
            <div className="flex min-w-0 items-center gap-1 rounded-md bg-gray-50 px-2 py-2 dark:bg-gray-800/50">
              <span className="min-w-0 flex-1 truncate text-sm text-gray-500 dark:text-gray-400">
                Vormonat
              </span>
              <span className="w-20 shrink-0 text-right text-sm text-gray-500 tabular-nums dark:text-gray-400">
                {formatEuro(carry)}
              </span>
              <span className="h-9 w-9 shrink-0" aria-hidden />
            </div>
          )}

          <BudgetColumn
            section="INCOME"
            entries={view.income}
            monthId={monthId}
          />
        </div>
      </section>

      {/* --- Ausgaben --- */}
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:flex-1">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-t-2xl bg-orange-100 px-4 py-3 dark:bg-orange-900/40">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-orange-900 dark:text-orange-200">
              Ausgaben
            </h2>
            {view.columns.length < MAX_EXPENSE_COLUMNS && (
              <AddExpenseColumn monthId={monthId} />
            )}
          </div>
          <span className="text-sm font-semibold text-orange-900 tabular-nums dark:text-orange-200">
            {formatEuro(totals.ausgaben)}
          </span>
        </header>

        {/* auto-fit: passt sich an 1–5 Spalten und jede Breite an. */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-4 gap-y-6 p-3 sm:p-4">
          {view.columns.map((c) => (
            <BudgetColumn
              key={c.id}
              section="EXPENSE"
              column={{ id: c.id, name: c.name }}
              entries={c.entries}
              monthId={monthId}
              sum={sumOf(c.entries)}
              collapsible
            />
          ))}
        </div>
      </section>

      {/* --- Saldo --- */}
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:w-64 xl:shrink-0">
        <header className="rounded-t-2xl bg-sky-100 px-4 py-3 text-center dark:bg-sky-900/40">
          <h2 className="text-sm font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200">
            Saldo
          </h2>
        </header>
        <div className="p-3 sm:p-4">
          <div
            className={`mb-3 flex items-center justify-between gap-2 rounded-lg px-3 py-3 ${
              restPositive
                ? "bg-sky-50 dark:bg-sky-950/30"
                : "bg-red-50 dark:bg-red-950/30"
            }`}
          >
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Verfügbar
            </span>
            <span
              className={`text-xl font-bold tabular-nums ${
                restPositive
                  ? "text-sky-700 dark:text-sky-300"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatEuro(totals.restbetrag)}
            </span>
          </div>

          {/* Kleine Herleitung, damit die Zahl nachvollziehbar bleibt. */}
          <dl className="mb-3 space-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
            <div className="flex justify-between gap-2">
              <dt>Einnahmen</dt>
              <dd className="tabular-nums">{formatEuro(totals.income)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>− Ausgaben</dt>
              <dd className="tabular-nums">{formatEuro(totals.ausgaben)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-gray-200 pt-1 dark:border-gray-700">
              <dt>= vor Abzügen</dt>
              <dd className="tabular-nums">{formatEuro(verfuegbar)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>− Abzüge</dt>
              <dd className="tabular-nums">{formatEuro(totals.ruecklagen)}</dd>
            </div>
          </dl>

          <p className="mb-1 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Abzüge (z. B. Tagesgeld, ETF)
          </p>
          <BudgetColumn
            section="RUECKLAGE"
            entries={view.ruecklagen}
            monthId={monthId}
          />
        </div>
      </section>
    </div>
  );
}
