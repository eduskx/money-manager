import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionUser } from "@/lib/user";
import { deleteAllMonths, deleteCurrentMonth } from "@/lib/actions";
import {
  computeTotals,
  flattenEntries,
  getMonth,
  isMonthAfter,
  loadMonthChain,
  loadMonthView,
  maxSelectableMonth,
  monthKey,
  previousMonth,
} from "@/lib/month";
import { BudgetBoard } from "@/components/BudgetBoard";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ImportTemplateTile } from "@/components/ImportTemplateTile";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { HeaderTools } from "@/components/HeaderTools";
import { headerButton } from "@/components/styles";

const monthYear = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

// searchParams ist in Next 16 asynchron.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Jahr/Monat aus der URL, sonst der aktuelle Monat.
  const sp = await searchParams;
  const now = new Date();
  let year = Number(sp.y);
  let month = Number(sp.m);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    year = now.getFullYear();
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    month = now.getMonth() + 1;
  }

  // Beschränkung: maximal ein Monat über den echten aktuellen Monat hinaus.
  // Weiter entfernte Monate werden gar nicht erst angelegt, sondern auf den
  // Grenz-Monat umgeleitet.
  const maxMonthValue = maxSelectableMonth();
  if (isMonthAfter(year, month, maxMonthValue)) {
    redirect(`/dashboard?y=${maxMonthValue.year}&m=${maxMonthValue.month}`);
  }

  // Nutzer und Monat holen. Der Nutzer kostet dank getSessionUser keine eigene
  // Abfrage (das Layout hat ihn in derselben Anfrage schon geholt), liefert
  // aber `carryOver` – und das braucht die Kette unten.
  //
  // `budgetMonth` kann null sein: Ein Monat existiert erst, wenn der Nutzer
  // auf „Vorlage importieren" geklickt hat. Bloßes Durchblättern legt nichts
  // mehr an.
  const [profile, budgetMonth] = await Promise.all([
    getSessionUser(),
    getMonth(session.user.id, year, month),
  ]);
  const displayName = profile?.name || profile?.email || session.user.email;
  const carryOver = profile?.carryOver ?? true;

  // Diese beiden wissen nichts voneinander – also nebeneinander statt
  // nacheinander. Kostet damit die Zeit der langsameren statt die Summe.
  //
  //   view  = die Ansicht dieses einen Monats (Spalten + Zeilen); entfällt,
  //           wenn der Monat noch gar nicht existiert
  //   chain = alle Monate durchgerechnet -> liefert den „Vormonat"-Übertrag
  //           sowie income/restbetrag inkl. Übertrag. Wird auch für den
  //           leeren Zustand gebraucht: Ihre Schlüssel sagen dem
  //           MonthSwitcher, welche Monate schon erzeugt sind.
  const [view, chain] = await Promise.all([
    budgetMonth ? loadMonthView(budgetMonth.id) : null,
    loadMonthChain(session.user.id, carryOver),
  ]);

  const comp =
    chain.get(monthKey(year, month)) ??
    // Fallback (sollte für einen existierenden Monat nicht vorkommen).
    (view
      ? {
          ...computeTotals(flattenEntries(view)),
          carry: 0,
          hasPrev: false,
          carryFrom: null,
        }
      : null);

  // Welche Monate gibt es schon? Format „2026-7" – dasselbe wie monthKey().
  const generatedKeys = Array.from(chain.keys());

  // Beschriftung der Übertrags-Zeile. Kommt der Übertrag aus dem direkten
  // Kalender-Vormonat, heißt sie wie gewohnt „Vormonat". Kommt er über eine
  // Lücke (Monate dazwischen gelöscht oder nie erzeugt), steht die Quelle
  // dran – sonst hieße die Zeile „Vormonat" und zeigte eine Zahl aus einem
  // ganz anderen Monat.
  const prevOf = previousMonth(year, month);
  const carryLabel =
    comp?.carryFrom &&
    !(
      comp.carryFrom.year === prevOf.year &&
      comp.carryFrom.month === prevOf.month
    )
      ? `Übertrag aus ${monthYear.format(
          new Date(comp.carryFrom.year, comp.carryFrom.month - 1),
        )}`
      : undefined; // undefined -> Standard „Vormonat"

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8">
        {/* Kopfzeile */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Marken-Punkt. aria-hidden, weil er nichts sagt, was nicht schon
                in der Überschrift daneben steht – ein Screenreader würde sonst
                nur „Euro-Zeichen" vorlesen. */}
            <span
              aria-hidden
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-bold text-on-accent"
            >
              €
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-ink">Meine Finanzen</h1>
              <p className="truncate text-sm text-muted">
                Angemeldet als {displayName}
              </p>
            </div>
          </div>

          {/* `w-full` auf dem Handy: Die Knopfzeile bekommt eine eigene Zeile
              unter der Marke – nur so ist Platz, und das ml-auto in
              HeaderTools schiebt die drei Icons an den rechten Rand.
              Ab sm wieder `w-auto`, dann sitzt die Gruppe wie gehabt kompakt
              rechts neben der Marke. */}
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Link href="/dashboard/sparkonten" className={headerButton}>
              Sparkonten
            </Link>
            <Link href="/dashboard/vorlage" className={headerButton}>
              Vorlage
            </Link>
            <HeaderTools />
          </div>
        </header>

        {/* Monatswechsel */}
        <div className="mt-6 flex justify-center">
          <MonthSwitcher
            year={year}
            month={month}
            maxYear={maxMonthValue.year}
            maxMonth={maxMonthValue.month}
            generatedKeys={generatedKeys}
          />
        </div>

        {/* Löschoptionen – bewusst dezent und vom Rest abgesetzt. Nur zu
            sehen, wenn es etwas zu löschen gibt: Auf einem leeren Monat wäre
            „Diesen Monat löschen" ein Knopf ohne Wirkung. */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          {budgetMonth && (
            <form action={deleteCurrentMonth}>
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />
              <ConfirmSubmit
                message={`„${monthYear.format(new Date(year, month - 1))}“ wirklich löschen? Alle Einträge dieses Monats gehen verloren. Du bleibst auf dem Monat und kannst die Vorlage neu importieren.`}
                className="rounded-md px-2 py-1.5 font-medium text-muted transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                Diesen Monat löschen
              </ConfirmSubmit>
            </form>
          )}

          {generatedKeys.length > 0 && (
            <form action={deleteAllMonths}>
              <ConfirmSubmit
                message={`Wirklich ALLE Monate löschen? Alle eingetragenen Monatsdaten gehen verloren – die Vorlage bleibt. Jeder Monat zeigt danach wieder „Vorlage importieren“; du landest beim aktuellen Monat (${monthYear.format(now)}).`}
                className="rounded-md px-2 py-1.5 font-medium text-muted transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                Alle Monate löschen
              </ConfirmSubmit>
            </form>
          )}
        </div>

        {/* Entweder das Budget – oder, wenn der Monat noch nicht erzeugt
            wurde, die gestrichelte Import-Kachel. */}
        <div className="mt-6">
          {budgetMonth && view && comp ? (
            <BudgetBoard
              monthId={budgetMonth.id}
              view={view}
              totals={comp}
              carry={comp.hasPrev ? comp.carry : null}
              carryLabel={carryLabel}
            />
          ) : (
            <ImportTemplateTile year={year} month={month} />
          )}
        </div>
      </div>
    </main>
  );
}
