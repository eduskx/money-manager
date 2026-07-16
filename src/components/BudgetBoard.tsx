import { MAX_EXPENSE_COLUMNS, type MonthView, type Totals } from "@/lib/month";
import { formatEuro } from "@/lib/format";
import { BudgetColumn } from "@/components/BudgetColumn";
import { AddExpenseColumn } from "@/components/AddExpenseColumn";
import { bigNumber, tile, tileAccent, tileHeading } from "@/components/styles";

function sumOf(entries: { amount: number }[]): number {
  return entries.reduce((total, e) => total + e.amount, 0);
}

// Die drei Blöcke des Budgets. Wird sowohl für einen echten Monat als auch für
// die Vorlage benutzt – der Aufbau ist gleich, nur der Rahmen drumherum
// (Kopfzeile, Monatswechsel) unterscheidet sich.
//
// Anordnung (Bento):
//   PC     Einnahmen oben links | Saldo oben rechts | Ausgaben volle Breite
//   Handy  Saldo zuerst, dann Einnahmen, dann Ausgaben
// Umgesetzt über `order`: Das Raster ist mobil einspaltig, ab lg zweispaltig.
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
  // Anteil an den Einnahmen – die eine Rechnung hinter allen Balken, egal ob
  // Ausgaben-Spalte oder Abzüge. Ohne Einnahmen gibt es keinen sinnvollen
  // Anteil; dann bleibt der Balken bei 0 %.
  const share = (amount: number) =>
    totals.income > 0 ? (amount / totals.income) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* --- Einnahmen: PC oben links, Handy unter dem Saldo --- */}
      <section className={`${tile} order-2 lg:order-1`}>
        <h2 className={tileHeading}>Einnahmen</h2>
        <p className={`mt-3 ${bigNumber}`}>{formatEuro(totals.income)}</p>

        {/* Trennstrich unter dem Gesamtstand – dasselbe Signal wie im
            Saldo-Block: „ab hier steht, woraus sich die Zahl ergibt". */}
        <div className="mt-4 border-t border-line pt-1">
          {/* Berechneter Übertrag aus dem Vormonat – nicht editierbar. Das
              Abstands-Element rechts hält die Beträge in einer Flucht mit den
              Zeilen darunter, die dort ihren Löschen-Knopf haben. */}
          {carry !== null && (
            <div className="flex min-w-0 items-center gap-1">
              <span className="min-w-0 flex-1 truncate px-2 py-2 text-sm text-faint">
                Vormonat
              </span>
              <span className="w-20 shrink-0 px-2 py-2 text-right text-sm text-faint tabular-nums">
                {formatEuro(carry)}
              </span>
              <span className="h-9 w-9 shrink-0" aria-hidden />
            </div>
          )}

          <BudgetColumn section="INCOME" entries={view.income} monthId={monthId} />
        </div>
      </section>

      {/* --- Saldo: die eine gefüllte Kachel --- */}
      <section className={`${tileAccent} order-1 lg:order-2`}>
        <h2 className={tileHeading}>Saldo</h2>
        <p className={`mt-3 ${bigNumber}`}>{formatEuro(totals.restbetrag)}</p>
        <p className="mt-1.5 text-sm text-muted">
          bleibt dir diesen Monat zum Ausgeben
        </p>

        {/* Kleine Herleitung, damit die Zahl nachvollziehbar bleibt. */}
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3.5 text-[13px]">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted">Einnahmen</dt>
            <dd className="font-semibold tabular-nums">
              {formatEuro(totals.income)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted">Ausgaben</dt>
            <dd className="font-semibold tabular-nums">
              {formatEuro(totals.ausgaben)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted">Abzüge</dt>
            <dd className="font-semibold tabular-nums">
              {formatEuro(totals.ruecklagen)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto pt-4">
          <p className="px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Abzüge
          </p>
          {/* Balken wie bei den Ausgaben-Spalten – dieselbe Komponente, dieselbe
              Rechnung (Anteil an den Einnahmen). Ohne eigenen Spaltenkopf
              landet er direkt unter der Überschrift. */}
          <BudgetColumn
            section="RUECKLAGE"
            entries={view.ruecklagen}
            monthId={monthId}
            share={share(totals.ruecklagen)}
          />
        </div>
      </section>

      {/* --- Ausgaben: über die volle Breite --- */}
      <section className={`${tile} order-3 lg:col-span-2`}>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className={tileHeading}>Ausgaben</h2>
            {view.columns.length < MAX_EXPENSE_COLUMNS && (
              <AddExpenseColumn monthId={monthId} />
            )}
          </div>
          <span className="text-lg font-bold tracking-tight tabular-nums sm:text-xl">
            {formatEuro(totals.ausgaben)}
          </span>
        </div>

        {/* auto-fit: passt sich an 1–5 Spalten und jede Breite an. */}
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 sm:gap-4">
          {view.columns.map((c) => {
            const sum = sumOf(c.entries);
            return (
              <BudgetColumn
                key={c.id}
                section="EXPENSE"
                column={{ id: c.id, name: c.name }}
                entries={c.entries}
                monthId={monthId}
                sum={sum}
                share={share(sum)}
                collapsible
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
