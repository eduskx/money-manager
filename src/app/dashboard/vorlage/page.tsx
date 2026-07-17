import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { clearTemplate } from "@/lib/actions";
import {
  computeTotals,
  flattenEntries,
  getOrCreateTemplate,
  loadMonthView,
} from "@/lib/month";
import { getSessionUser } from "@/lib/user";
import { BudgetBoard } from "@/components/BudgetBoard";
import { CarryOverSwitch } from "@/components/CarryOverSwitch";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { HeaderTools } from "@/components/HeaderTools";
import { headerIconButton } from "@/components/styles";
import { IconChevronLeft } from "@/components/icons";

// Die Vorlage: gleiche Struktur wie ein Monat, dient aber als Grundlage für
// jeden neuen Monat. Was du hier einträgst (Gehalt, Fixkosten, Alltag …), wird
// beim ersten Öffnen eines neuen Monats automatisch übernommen.
export default async function VorlagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, template] = await Promise.all([
    getSessionUser(),
    getOrCreateTemplate(session.user.id),
  ]);
  if (!user) redirect("/login");

  const view = await loadMonthView(template.id);
  const totals = computeTotals(flattenEntries(view));

  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8">
        {/* Kopfzeile */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Zurück zur Monatsansicht"
              className={headerIconButton}
            >
              <IconChevronLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-ink">Vorlage</h1>
              <p className="text-sm text-muted">
                Grundlage für jeden neuen Monat
              </p>
            </div>
          </div>

          <HeaderTools />
        </header>

        <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          <p>
            Änderungen hier werden automatisch auf alle Monate übertragen, die du{" "}
            <strong>noch nicht selbst bearbeitet</strong> hast (auch bereits
            angelegte, leere Monate). Sobald du in einem Monat etwas änderst,
            bleibt dieser von der Vorlage unabhängig.
          </p>
          {/* Der Text sagt, was der Schalter daneben gerade bewirkt – sonst
              würde hier eine Regel behauptet, die abgeschaltet ist. */}
          <p className="mt-2">
            {user.carryOver ? (
              <>
                <strong>Vormonat wird übertragen:</strong> Was in einem Monat
                übrig bleibt, zählt im nächsten als Einnahme mit. Der Wert wird
                bei jedem Aufruf neu berechnet – änderst du einen früheren
                Monat, ziehen alle folgenden automatisch nach.
              </>
            ) : (
              <>
                <strong>Vormonat wird nicht übertragen:</strong> Jeder Monat
                steht für sich, die Zeile „Vormonat“ entfällt. Es geht dabei
                nichts verloren – schaltest du wieder ein, ist alles wie zuvor.
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={clearTemplate}>
              <ConfirmSubmit
                message="Vorlage wirklich leeren? Alle Einträge UND alle Ausgaben-Spalten werden gelöscht. Alle unberührten Monate werden dadurch ebenfalls geleert. Bearbeitete Monate bleiben erhalten."
                className="inline-flex h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Vorlage leeren
              </ConfirmSubmit>
            </form>
            <CarryOverSwitch enabled={user.carryOver} />
          </div>
        </div>

        {/* Gleicher Aufbau wie ein Monat */}
        <div className="mt-6">
          <BudgetBoard monthId={template.id} view={view} totals={totals} />
        </div>
      </div>
    </main>
  );
}
