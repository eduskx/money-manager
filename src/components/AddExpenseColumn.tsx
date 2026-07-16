import { addExpenseColumn } from "@/lib/actions";
import { IconPlus } from "@/components/icons";

// Dezenter Button im Ausgaben-Kopf: legt sofort eine weitere Spalte namens
// „Neue Spalte" an. Umbenennen kann der Nutzer sie danach direkt im
// Spaltenkopf. Ab MAX_EXPENSE_COLUMNS rendert das BudgetBoard ihn nicht mehr.
//
// Braucht keinen Client-State – ein einfaches Formular mit Server-Action reicht.
export function AddExpenseColumn({ monthId }: { monthId: string }) {
  return (
    <form action={addExpenseColumn} className="shrink-0">
      <input type="hidden" name="monthId" value={monthId} />
      <input type="hidden" name="name" value="Neue Spalte" />
      <button
        type="submit"
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-orange-300 px-2.5 text-xs font-medium text-orange-900 transition hover:bg-orange-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 dark:border-orange-200/25 dark:text-orange-200 dark:hover:bg-orange-900/60"
      >
        <IconPlus className="h-3.5 w-3.5" />
        Weitere Spalte hinzufügen
      </button>
    </form>
  );
}
