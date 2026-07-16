import type { ReactNode } from "react";
import { deleteCustomBlock } from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import type { TagesgeldEntryView } from "@/lib/tagesgeld";
import { TagesgeldEntryRow } from "@/components/TagesgeldEntryRow";
import { TagesgeldAddEntry } from "@/components/TagesgeldAddEntry";
import { TagesgeldBlockName } from "@/components/TagesgeldBlockName";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { IconTrash } from "@/components/icons";

// Ein Karten-Block auf der Tagesgeld-Seite: Titel (farbiger Kopf), Einträge,
// „Zeile hinzufügen" und eine Summenzeile. Optional mit Element rechts im Kopf
// (z. B. Jahres-Umschalter) und – für eigene Blöcke – einem Löschen-Button.
export function TagesgeldBlockCard({
  title,
  blockId,
  entries,
  sum,
  headerAccent,
  addYear = null,
  headerRight,
  deletable = false,
  editableName = false,
}: {
  title: string;
  blockId: string;
  entries: TagesgeldEntryView[];
  sum: number;
  headerAccent: string;
  addYear?: number | null;
  headerRight?: ReactNode;
  deletable?: boolean;
  editableName?: boolean; // eigene Blöcke: Name direkt im Kopf bearbeitbar
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header
        className={`flex h-14 items-center justify-between gap-2 rounded-t-2xl px-4 ${headerAccent}`}
      >
        {editableName ? (
          <TagesgeldBlockName blockId={blockId} name={title} />
        ) : (
          <h2
            title={title}
            className="truncate text-sm font-bold uppercase tracking-wide"
          >
            {title}
          </h2>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {headerRight}
          {deletable && (
            <form action={deleteCustomBlock}>
              <input type="hidden" name="id" value={blockId} />
              <ConfirmSubmit
                message={`Block „${title}“ mit allen Einträgen wirklich löschen?`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-black/5 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-red-400"
              >
                <IconTrash className="h-4 w-4" />
              </ConfirmSubmit>
            </form>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="space-y-0.5">
          {entries.map((e) => (
            <TagesgeldEntryRow
              key={e.id}
              id={e.id}
              label={e.label}
              amount={e.amount}
              formula={e.formula}
            />
          ))}
        </div>

        <TagesgeldAddEntry blockId={blockId} year={addYear} />

        <div className="mt-auto flex items-center justify-between gap-2 rounded-md bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-900 dark:bg-gray-800/60 dark:text-gray-100">
          <span className="text-gray-600 dark:text-gray-400">Summe</span>
          <span className="tabular-nums">{formatEuro(sum)}</span>
        </div>
      </div>
    </section>
  );
}
