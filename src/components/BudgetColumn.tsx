"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";
import type { Section } from "@prisma/client";
import type { EntryView } from "@/lib/month";
import { deleteExpenseColumn, renameExpenseColumn } from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import { EntryRow } from "@/components/EntryRow";
import { AddEntry } from "@/components/AddEntry";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { IconChevronRight, IconTrash } from "@/components/icons";

// Eine Spalte/ein Abschnitt mit Einträgen, „Zeile hinzufügen" und – optional –
// einer Summenzeile am Fuß.
//
// `column` ist nur bei Ausgaben gesetzt. Dann bekommt der Kopf ein
// editierbares Namensfeld und einen Löschen-Button; die Zeilen hängen an der
// Spalte (columnId) statt am Abschnitt.
//
// `collapsible`: blendet auf dem Handy einen Pfeil im Kopf ein, mit dem sich
// die Zeilen sanft ein- und ausklappen lassen. Ab md ist der Block immer offen.
export function BudgetColumn({
  section,
  entries,
  monthId,
  sum,
  column,
  collapsible = false,
}: {
  section: Section;
  entries: EntryView[];
  monthId: string;
  sum?: number; // gesetzt => Summenzeile unten anzeigen
  column?: { id: string; name: string };
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const nameFormRef = useRef<HTMLFormElement>(null);
  const savedName = useRef(column?.name ?? "");

  // Spaltenname beim Verlassen des Feldes oder mit Enter speichern.
  function saveName() {
    const value = nameRef.current?.value.trim() ?? "";
    if (!value || value === savedName.current) return;
    savedName.current = value;
    nameFormRef.current?.requestSubmit();
  }
  function nameKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName();
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      {column && (
        <div className="mb-1 flex items-center gap-1">
          <form
            ref={nameFormRef}
            action={renameExpenseColumn}
            className="min-w-0 flex-1"
          >
            <input type="hidden" name="id" value={column.id} />
            <input
              ref={nameRef}
              name="name"
              defaultValue={column.name}
              onBlur={saveName}
              onKeyDown={nameKey}
              title={column.name}
              aria-label="Name der Spalte"
              className="w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 py-1.5 text-center text-sm font-semibold text-gray-700 outline-none hover:border-gray-200 focus:border-emerald-500 focus:bg-white dark:text-gray-300 dark:hover:border-gray-700 dark:focus:bg-gray-800"
            />
          </form>

          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? `${column.name} einklappen` : `${column.name} ausklappen`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
            >
              <IconChevronRight
                className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${
                  open ? "rotate-90" : ""
                }`}
              />
            </button>
          )}

          <form action={deleteExpenseColumn} className="shrink-0">
            <input type="hidden" name="id" value={column.id} />
            <ConfirmSubmit
              message={`Spalte „${column.name}“ mit allen Einträgen wirklich löschen?`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-gray-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <IconTrash className="h-4 w-4" />
            </ConfirmSubmit>
          </form>
        </div>
      )}

      {/* Klappbereich: grid-rows 1fr<->0fr animiert die Höhe ohne feste Werte.
          Ab md immer offen. */}
      <div
        id={bodyId}
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none md:grid-rows-[1fr] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5">
            {entries.map((e) => (
              <EntryRow
                key={e.id}
                id={e.id}
                label={e.label}
                amount={e.amount}
                formula={e.formula}
              />
            ))}
          </div>
          <AddEntry
            monthId={monthId}
            section={section}
            columnId={column?.id ?? null}
          />
        </div>
      </div>

      {typeof sum === "number" && (
        <div className="mt-auto flex items-center justify-between gap-2 rounded-md bg-orange-50 px-2 py-2 text-sm font-semibold text-gray-900 dark:bg-orange-950/30 dark:text-gray-100">
          <span className="text-gray-600 dark:text-gray-400">Summe</span>
          <span className="tabular-nums">{formatEuro(sum)}</span>
        </div>
      )}
    </div>
  );
}
