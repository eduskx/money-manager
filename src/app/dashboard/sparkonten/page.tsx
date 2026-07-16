import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  loadAccountSummaries,
  MAX_SAVINGS_ACCOUNTS,
} from "@/lib/tagesgeld";
import {
  addSavingsAccount,
  deleteSavingsAccount,
  renameSavingsAccount,
} from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import { EditableName } from "@/components/EditableName";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
} from "@/components/icons";

// Übersicht aller Sparkonten: je Konto Name (bearbeitbar) und Saldo. Ein Klick
// auf die Karte öffnet das Konto mit seinen Blöcken.
export default async function SparkontenPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await loadAccountSummaries(session.user.id);
  const canAdd = accounts.length < MAX_SAVINGS_ACCOUNTS;
  const canDelete = accounts.length > 1;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
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
                Sparkonten
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {accounts.length} von {MAX_SAVINGS_ACCOUNTS} Konten
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAdd && (
              <form action={addSavingsAccount}>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <IconPlus className="h-4 w-4" />
                  Konto hinzufügen
                </button>
              </form>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Konten */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <article
              key={a.id}
              className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-sky-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-sky-800"
            >
              <header className="flex h-14 items-center gap-1 rounded-t-2xl bg-sky-100 px-3 dark:bg-sky-900/40">
                <EditableName
                  id={a.id}
                  name={a.name}
                  action={renameSavingsAccount}
                  ariaLabel="Name des Sparkontos"
                  className="text-sm font-bold uppercase tracking-wide text-sky-900 dark:text-sky-200"
                  iconClassName="text-sky-900/60 dark:text-sky-200/60"
                />
                {canDelete && (
                  <form action={deleteSavingsAccount} className="shrink-0">
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmSubmit
                      message={`Sparkonto „${a.name}“ wirklich löschen? Alle Blöcke und Einträge dieses Kontos gehen unwiderruflich verloren.`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sky-900/50 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-sky-200/50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <IconTrash className="h-4 w-4" />
                    </ConfirmSubmit>
                  </form>
                )}
              </header>

              {/* Der Saldo-Bereich ist der Link ins Konto. */}
              <Link
                href={`/dashboard/sparkonten/${a.id}`}
                className="flex flex-1 items-end justify-between gap-2 rounded-b-2xl p-4 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 dark:hover:bg-gray-800/50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Saldo
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold tabular-nums ${
                      a.saldo >= 0
                        ? "text-sky-700 dark:text-sky-300"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatEuro(a.saldo)}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 text-gray-400 dark:text-gray-500"
                >
                  <IconChevronRight className="h-5 w-5" />
                </span>
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
