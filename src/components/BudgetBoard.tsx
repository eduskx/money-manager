import { MAX_EXPENSE_COLUMNS, type MonthView, type Totals } from "@/lib/month";
import { formatEuro } from "@/lib/format";
import { BudgetColumn } from "@/components/BudgetColumn";
import { CollapsibleBlock } from "@/components/CollapsibleBlock";
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
// `carry`: der berechnete Übertrag. `null` bei der Vorlage (dort gibt es
// keinen Vormonat) – dann wird die Zeile nicht angezeigt. Die in `totals`
// übergebenen income/restbetrag enthalten den Übertrag bereits.
//
// `carryLabel`: Beschriftung der Übertrags-Zeile. Standard „Vormonat";
// die Seite gibt etwas anderes mit, wenn der Übertrag über eine Lücke aus
// einem weiter zurückliegenden Monat kommt (z. B. „Übertrag aus April 2026").
export function BudgetBoard({
  monthId,
  view,
  totals,
  carry = null,
  carryLabel = "Vormonat",
}: {
  monthId: string;
  view: MonthView;
  totals: Totals;
  carry?: number | null;
  carryLabel?: string;
}) {
  // Anteil an den Einnahmen – die eine Rechnung hinter allen Balken, egal ob
  // Ausgaben-Spalte oder Abzüge. Ohne Einnahmen gibt es keinen sinnvollen
  // Anteil; dann bleibt der Balken bei 0 %.
  const share = (amount: number) =>
    totals.income > 0 ? (amount / totals.income) * 100 : 0;

  // Wie breit ist EINE Ausgaben-Spalte?
  //
  // Eine Regel, aus der sich alles ergibt: Nebeneinander stehen nur so viele
  // Spalten, dass jede mindestens MIN_COLUMN_WIDTH (350 px) breit bleibt –
  // höchstens aber drei. Daraus folgen die Schwellen:
  //
  //   zwei nebeneinander  ab 2*350 + 1*16 =  716 px Kachelbreite
  //   drei nebeneinander  ab 3*350 + 2*16 = 1082 px Kachelbreite
  //
  // Darunter steht jede Spalte auf voller Breite. Ein hartes `min-width` wäre
  // hier falsch: Auf einem schmalen Handy sind gar keine 350 px da, und die
  // Seite würde seitlich überlaufen. 350 px ist eine Bedingung dafür, ob
  // nebeneinander gestellt wird – keine Größe, die erzwungen werden kann.
  //
  // Warum die Anzahl mitzählt: Bei zwei Spalten sollen sich beide den Platz
  // teilen, statt ein Drittel freizuhalten. Deshalb hängt die Breite an
  // `min(Anzahl, 3)` und nicht allein an der Kachelbreite.
  //
  // Eine einzelne Spalte bekommt höchstens die Hälfte – sonst zöge sie sich
  // über die ganze Kachel, und eine Zeile „Miete … 451,00" mit einem halben
  // Meter Weiß dazwischen liest sich schlecht.
  //
  // Die Klassen stehen absichtlich ausgeschrieben da, statt aus Bausteinen
  // zusammengesetzt zu werden: Tailwind durchsucht den QUELLTEXT nach
  // Klassennamen. Was erst zur Laufzeit entsteht, sieht es nicht – und
  // erzeugt das CSS dafür nicht.
  const columnWidth =
    view.columns.length <= 2
      ? "w-full @min-[716px]:w-[calc((100%-1rem)/2)]"
      : "w-full @min-[716px]:w-[calc((100%-1rem)/2)] @min-[1082px]:w-[calc((100%-2rem)/3)]";

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* --- Einnahmen: PC oben links, Handy unter dem Saldo --- */}
      <section className={`${tile} order-2 lg:order-1`}>
        <CollapsibleBlock
          heading={<h2 className={tileHeading}>Einnahmen</h2>}
          summary={<p className={`mt-1 ${bigNumber}`}>{formatEuro(totals.income)}</p>}
        >
          {/* Trennstrich unter dem Gesamtstand – dasselbe Signal wie im
              Saldo-Block: „ab hier steht, woraus sich die Zahl ergibt". */}
          <div className="mt-4 border-t border-line pt-1">
            {/* Berechneter Übertrag – nicht editierbar. Das Abstands-Element
                rechts hält die Beträge in einer Flucht mit den Zeilen darunter,
                die dort ihren Löschen-Knopf haben. */}
            {carry !== null && (
              <div className="flex min-w-0 items-center gap-1">
                <span
                  title={carryLabel}
                  className="min-w-0 flex-1 truncate px-2 py-2 text-sm text-faint"
                >
                  {carryLabel}
                </span>
                <span className="w-20 shrink-0 px-2 py-2 text-right text-sm text-faint tabular-nums">
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
        </CollapsibleBlock>
      </section>

      {/* --- Saldo: die eine gefüllte Kachel ---
          Der Pfeil sitzt (wie bei den Einnahmen) links neben „Saldo" und
          klappt ALLES weg außer der großen Zahl und dem Infotext darunter –
          die beiden bilden die `summary`. Nur EIN Pfeil: die Abzüge klappen
          mit ein, sie haben keinen eigenen mehr. */}
      <section className={`${tileAccent} order-1 lg:order-2`}>
        <CollapsibleBlock
          heading={<h2 className={tileHeading}>Saldo</h2>}
          summary={
            <>
              <p className={`mt-1 ${bigNumber}`}>
                {formatEuro(totals.restbetrag)}
              </p>
              <p className="mt-1.5 text-sm text-muted">
                bleibt dir diesen Monat zum Ausgeben
              </p>
            </>
          }
        >
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

          <div className="mt-4">
            <p className="px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Abzüge
            </p>
            {/* Balken wie bei den Ausgaben-Spalten – dieselbe Komponente,
                dieselbe Rechnung (Anteil an den Einnahmen). */}
            <BudgetColumn
              section="RUECKLAGE"
              entries={view.ruecklagen}
              monthId={monthId}
              share={share(totals.ruecklagen)}
            />
          </div>
        </CollapsibleBlock>
      </section>

      {/* --- Ausgaben: über die volle Breite ---
          `@container` macht diese Kachel zum Bezugspunkt für die
          Container-Abfrage weiter unten. */}
      <section className={`${tile} @container order-3 lg:col-span-2`}>
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

        {/* Flexbox statt Grid – und das ist der Kern.

            Mit `grid-cols-3` legt das Raster IMMER drei Spuren an, auch wenn
            es nur zwei Spalten gibt: Die dritte bleibt leer, und die zwei
            stehen schmal nebeneinander statt sich den Platz zu teilen. Bei
            Flexbox gibt es keine leeren Spuren – die Breite steht an den
            Elementen selbst, und die richtet sich danach, wie viele es gibt.

            `justify-start`: linksbündig. Volle Reihen füllen die Breite
            ohnehin aus (dort bewirkt es nichts), eine einzelne oder eine
            angebrochene letzte Reihe hängt links statt in der Mitte.

            Alle Schwellen sind CONTAINER-Abfragen, keine Geräte-Abfragen:
            Entscheidend ist, wie breit die Ausgaben-Kachel wirklich ist –
            nicht der Bildschirm. Läge sie eines Tages in einer schmalen
            Spalte, stimmte eine `sm:`-Regel nicht mehr, diese schon.

            Einheitlicher `gap-4`, damit die Rechnungen unten exakt aufgehen –
            vorher war er auf dem Handy 4 px kleiner, was die Breiten um
            Bruchteile verzogen hätte. */}
        <div className="mt-4 flex flex-wrap justify-start gap-4">
          {view.columns.map((c) => {
            const sum = sumOf(c.entries);
            return (
              // Der Wrapper trägt nur die Breite. `min-w-0`, sonst kann der
              // Inhalt ihn auseinanderdrücken.
              <div key={c.id} className={`min-w-0 ${columnWidth}`}>
                <BudgetColumn
                  section="EXPENSE"
                  column={{ id: c.id, name: c.name }}
                  entries={c.entries}
                  monthId={monthId}
                  sum={sum}
                  share={share(sum)}
                  collapsible
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
