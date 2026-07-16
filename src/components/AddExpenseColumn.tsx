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
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <IconPlus className="h-3.5 w-3.5" />
        Neue Spalte
      </button>
    </form>
  );
}
