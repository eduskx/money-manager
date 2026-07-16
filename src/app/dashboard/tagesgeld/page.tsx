import Link from "next/link";
import { redirect } from "next/navigation";
import { TagesgeldKind } from "@prisma/client";

import { auth } from "@/auth";
import {
  computeTagesgeldTotals,
  getOrCreateTagesgeldBlocks,
  sumEntries,
} from "@/lib/tagesgeld";
import { formatEuro } from "@/lib/format";
import { TagesgeldBlockCard } from "@/components/TagesgeldBlockCard";
import { AddCustomBlock } from "@/components/AddCustomBlock";
import { YearSwitcher } from "@/components/YearSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconChevronLeft } from "@/components/icons";

export default async function TagesgeldPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Jahr aus der URL; weiter als das echte aktuelle Jahr geht es nicht.
  const maxYear = new Date().getFullYear();
  const sp = await searchParams;
  let year = Number(sp.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    year = maxYear;
  }
  if (year > maxYear) redirect(`/dashboard/tagesgeld?year=${maxYear}`);

  const blocks = await getOrCreateTagesgeldBlocks(session.user.id);
  const totals = computeTagesgeldTotals(blocks);

  const einnahmen = blocks.find((b) => b.kind === TagesgeldKind.EINNAHMEN);
  const ausgaben = blocks.find((b) => b.kind === TagesgeldKind.AUSGABEN);
  const zurueck = blocks.find((b) => b.kind === TagesgeldKind.ZURUECKGELEGT);
  const customBlocks = blocks.filter((b) => b.kind === TagesgeldKind.CUSTOM);

  // Einnahmen und Ausgaben werden pro Jahr angezeigt – der Saldo zählt aber
  // weiterhin alle Jahre zusammen.
  const einnahmenYear = (einnahmen?.entries ?? []).filter((e) => e.year === year);
  const ausgabenYear = (ausgaben?.entries ?? []).filter((e) => e.year === year);

  const saldoPositive = totals.saldo >= 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8">
        {/* Kopfzeile */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Zurück zur Monatsansicht"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <IconChevronLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Tagesgeld
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Konto-Saldo über alle Jahre
              </p>
            </div>
          </div>

          <ThemeToggle />
        </header>

        {/* Saldo-Übersicht */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              saldoPositive
                ? "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            }`}
          >
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Saldo (Kontostand)
            </p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums ${
                saldoPositive
                  ? "text-sky-700 dark:text-sky-300"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatEuro(totals.saldo)}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Einnahmen {formatEuro(totals.einnahmen)} − Ausgaben{" "}
              {formatEuro(totals.ausgaben)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Saldo exkl. Rücklagen
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
              {formatEuro(totals.saldoExklZurueck)}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Saldo − Rücklagen {formatEuro(totals.zurueckgelegt)}
            </p>
          </div>
        </section>

        {/* Blöcke */}
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {einnahmen && (
            <TagesgeldBlockCard
              title="Einnahmen"
              blockId={einnahmen.id}
              entries={einnahmenYear}
              sum={sumEntries(einnahmenYear)}
              headerAccent="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
              addYear={year}
              headerRight={<YearSwitcher year={year} maxYear={maxYear} />}
            />
          )}

          {ausgaben && (
            <TagesgeldBlockCard
              title="Ausgaben"
              blockId={ausgaben.id}
              entries={ausgabenYear}
              sum={sumEntries(ausgabenYear)}
              headerAccent="bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200"
              addYear={year}
              headerRight={<YearSwitcher year={year} maxYear={maxYear} />}
            />
          )}

          {zurueck && (
            <TagesgeldBlockCard
              title="Rücklagen"
              blockId={zurueck.id}
              entries={zurueck.entries}
              sum={sumEntries(zurueck.entries)}
              headerAccent="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
            />
          )}

          {customBlocks.map((b) => (
            <TagesgeldBlockCard
              key={b.id}
              title={b.name}
              blockId={b.id}
              entries={b.entries}
              sum={sumEntries(b.entries)}
              headerAccent="bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200"
              deletable
              editableName
            />
          ))}

          {/* Eigenen Block anlegen – sieht aus wie ein Block, nur grau. */}
          <AddCustomBlock />
        </section>
      </div>
    </main>
  );
}
