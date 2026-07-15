import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { deleteAllMonths, deleteCurrentMonth, logout } from "@/lib/actions";
import {
  computeTotals,
  getEntriesBySection,
  getOrCreateMonth,
  isMonthAfter,
  loadMonthChain,
  maxSelectableMonth,
  monthKey,
} from "@/lib/month";
import { BudgetBoard } from "@/components/BudgetBoard";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  // Monat holen oder aus der Vorlage anlegen.
  const budgetMonth = await getOrCreateMonth(session.user.id, year, month);
  const grouped = await getEntriesBySection(budgetMonth.id);

  // Ganze Monatskette durchrechnen -> liefert den dynamischen „Saldo aus
  // Vormonat" (carry) sowie income/restbetrag inkl. Übertrag.
  const chain = await loadMonthChain(session.user.id);
  const comp =
    chain.get(monthKey(year, month)) ??
    // Fallback (sollte nach getOrCreateMonth nicht vorkommen): ohne Übertrag.
    { ...computeTotals(Object.values(grouped).flat()), carry: 0, hasPrev: false };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8">
        {/* Kopfzeile */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Meine Finanzen
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Angemeldet als {session.user.name ?? session.user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/tagesgeld"
              className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Tagesgeld
            </Link>
            <Link
              href="/dashboard/vorlage"
              className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Vorlage
            </Link>
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Abmelden
              </button>
            </form>
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
              className="rounded-md px-2 py-1.5 font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              Diesen Monat löschen
            </ConfirmSubmit>
          </form>

          <form action={deleteAllMonths}>
            <ConfirmSubmit
              message={`Wirklich ALLE Monate löschen? Danach landest du beim aktuellen Monat (${monthYear.format(now)}), der frisch aus der Vorlage erstellt wird. Alle eingetragenen Monatsdaten gehen verloren – die Vorlage bleibt.`}
              className="rounded-md px-2 py-1.5 font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              Alle Monate löschen
            </ConfirmSubmit>
          </form>
        </div>

        {/* Drei Blöcke: Einnahmen | Ausgaben | Saldo */}
        <div className="mt-6">
          <BudgetBoard
            monthId={budgetMonth.id}
            grouped={grouped}
            totals={comp}
            carry={comp.hasPrev ? comp.carry : null}
          />
        </div>
      </div>
    </main>
  );
}
