import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getSessionUser } from "@/lib/user";
import { deleteAllMonths, deleteCurrentMonth } from "@/lib/actions";
import {
  computeTotals,
  flattenEntries,
  getOrCreateMonth,
  isMonthAfter,
  loadMonthChain,
  loadMonthView,
  maxSelectableMonth,
  monthKey,
} from "@/lib/month";
import { BudgetBoard } from "@/components/BudgetBoard";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
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

  // Monat holen oder aus der Vorlage anlegen. Muss zuerst laufen: Die Kette
  // unten soll den Monat mitzählen, auch wenn er gerade erst entsteht.
  const budgetMonth = await getOrCreateMonth(session.user.id, year, month);

  // Diese beiden wissen nichts voneinander – also nebeneinander statt
  // nacheinander. Kostet damit die Zeit der langsameren statt die Summe.
  //
  //   view  = die Ansicht dieses einen Monats (Spalten + Zeilen)
  //   chain = alle Monate durchgerechnet -> liefert den „Vormonat"-Übertrag
  //           sowie income/restbetrag inkl. Übertrag
  const [view, chain] = await Promise.all([
    loadMonthView(budgetMonth.id),
    loadMonthChain(session.user.id),
  ]);

  const comp =
    chain.get(monthKey(year, month)) ??
    // Fallback (sollte nach getOrCreateMonth nicht vorkommen): ohne Übertrag.
    { ...computeTotals(flattenEntries(view)), carry: 0, hasPrev: false };

  // Anzeigename frisch aus der DB, damit Profil-Änderungen sofort erscheinen.
  // Kostet keine eigene Abfrage: Das Layout hat den Nutzer in derselben
  // Anfrage schon geholt, getSessionUser gibt ihn nur weiter.
  const profile = await getSessionUser();
  const displayName = profile?.name || profile?.email || session.user.email;

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

          <div className="flex items-center gap-2">
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
          />
        </div>

        {/* Löschoptionen – bewusst dezent und vom Rest abgesetzt. */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <form action={deleteCurrentMonth}>
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="month" value={month} />
            <ConfirmSubmit
              message={`„${monthYear.format(new Date(year, month - 1))}“ wirklich löschen? Du springst danach zum Vormonat; neu erstellt wird der Monat erst wieder, wenn du ihn selbst ansteuerst.`}
              className="rounded-md px-2 py-1.5 font-medium text-muted transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              Diesen Monat löschen
            </ConfirmSubmit>
          </form>

          <form action={deleteAllMonths}>
            <ConfirmSubmit
              message={`Wirklich ALLE Monate löschen? Danach landest du beim aktuellen Monat (${monthYear.format(now)}), der frisch aus der Vorlage erstellt wird. Alle eingetragenen Monatsdaten gehen verloren – die Vorlage bleibt.`}
              className="rounded-md px-2 py-1.5 font-medium text-muted transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              Alle Monate löschen
            </ConfirmSubmit>
          </form>
        </div>

        {/* Drei Blöcke: Einnahmen | Ausgaben | Saldo */}
        <div className="mt-6">
          <BudgetBoard
            monthId={budgetMonth.id}
            view={view}
            totals={comp}
            carry={comp.hasPrev ? comp.carry : null}
          />
        </div>
      </div>
    </main>
  );
}
