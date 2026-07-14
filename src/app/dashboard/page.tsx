import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addTransaction, deleteTransaction, logout } from "@/lib/actions";

// Betrag als Euro formatieren.
const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  // Kennzahlen berechnen. amount ist ein Prisma-Decimal -> in Number wandeln.
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const value = Number(t.amount);
    if (t.type === "INCOME") income += value;
    else expense += value;
  }
  const balance = income - expense;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Kopfzeile */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Meine Finanzen
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Angemeldet als {session.user.name ?? session.user.email}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Abmelden
            </button>
          </form>
        </header>

        {/* Übersicht */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="Einnahmen" value={euro.format(income)} tone="income" />
          <SummaryCard label="Ausgaben" value={euro.format(expense)} tone="expense" />
          <SummaryCard label="Saldo" value={euro.format(balance)} tone="balance" />
        </section>

        {/* Neue Buchung */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Neue Buchung
          </h2>
          <form
            action={addTransaction}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Beschreibung
              </label>
              <input
                name="description"
                type="text"
                required
                placeholder="z. B. Wocheneinkauf"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Betrag (€)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400">
                Datum
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={today}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="type"
                  value="EXPENSE"
                  defaultChecked
                  className="accent-emerald-600"
                />
                Ausgabe
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="type"
                  value="INCOME"
                  className="accent-emerald-600"
                />
                Einnahme
              </label>

              <button
                type="submit"
                className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700"
              >
                Hinzufügen
              </button>
            </div>
          </form>
        </section>

        {/* Liste */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Buchungen
          </h2>

          {transactions.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Noch keine Buchungen. Leg oben die erste an!
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {transactions.map((t) => {
                const isIncome = t.type === "INCOME";
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.date.toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          isIncome
                            ? "font-semibold text-emerald-600 dark:text-emerald-400"
                            : "font-semibold text-red-600 dark:text-red-400"
                        }
                      >
                        {isIncome ? "+" : "−"}
                        {euro.format(Number(t.amount))}
                      </span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          aria-label="Buchung löschen"
                          className="rounded-md px-2 py-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "balance";
}) {
  const toneClass = {
    income: "text-emerald-600 dark:text-emerald-400",
    expense: "text-red-600 dark:text-red-400",
    balance: "text-gray-900 dark:text-white",
  }[tone];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
