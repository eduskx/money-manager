import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { clearTemplate } from "@/lib/actions";
import {
  computeTotals,
  getEntriesBySection,
  getOrCreateTemplate,
} from "@/lib/month";
import { BudgetBoard } from "@/components/BudgetBoard";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IconChevronLeft } from "@/components/icons";

// Die Vorlage: gleiche Struktur wie ein Monat, dient aber als Grundlage für
// jeden neuen Monat. Was du hier einträgst (Gehalt, Fixkosten, Alltag …), wird
// beim ersten Öffnen eines neuen Monats automatisch übernommen.
export default async function VorlagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const template = await getOrCreateTemplate(session.user.id);
  const grouped = await getEntriesBySection(template.id);
  const totals = computeTotals(Object.values(grouped).flat());

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
                Vorlage
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Grundlage für jeden neuen Monat
              </p>
            </div>
          </div>

          <ThemeToggle />
        </header>

        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
          <p>
            Änderungen hier werden automatisch auf alle Monate übertragen, die du{" "}
            <strong>noch nicht selbst bearbeitet</strong> hast (auch bereits
            angelegte, leere Monate). Sobald du in einem Monat etwas änderst,
            bleibt dieser von der Vorlage unabhängig. „Vormonat“ wird automatisch
            beim Monatswechsel berechnet.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={clearTemplate}>
              <ConfirmSubmit
                message="Vorlage wirklich leeren? Alle unberührten Monate werden dadurch ebenfalls geleert. Bearbeitete Monate bleiben erhalten."
                className="inline-flex h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Vorlage leeren
              </ConfirmSubmit>
            </form>
          </div>
        </div>

        {/* Gleicher Aufbau wie ein Monat */}
        <div className="mt-6">
          <BudgetBoard
            monthId={template.id}
            grouped={grouped}
            totals={totals}
          />
        </div>
      </div>
    </main>
  );
}
