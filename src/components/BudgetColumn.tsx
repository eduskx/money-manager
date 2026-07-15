"use client";

import { useId, useState } from "react";
import type { Section } from "@prisma/client";
import type { EntryView } from "@/lib/month";
import { formatEuro } from "@/lib/format";
import { EntryRow } from "@/components/EntryRow";
import { AddEntry } from "@/components/AddEntry";
import { IconChevronRight } from "@/components/icons";

// Eine Spalte/ein Abschnitt mit Einträgen, „Zeile hinzufügen" und – optional –
// einer Summenzeile am Fuß (wie in Excel unter den Ausgaben-Spalten).
//
// `collapsible`: blendet auf dem Handy einen Pfeil im Kopf ein, mit dem sich
// die Zeilen sanft ein- und ausklappen lassen. Auf größeren Screens (md+) ist
// der Block immer offen und der Pfeil ausgeblendet. Titel und Summe bleiben
// auch im eingeklappten Zustand sichtbar.
export function BudgetColumn({
  title,
  section,
  entries,
  monthId,
  sum,
  collapsible = false,
}: {
  title?: string;
  section: Section;
  entries: EntryView[];
  monthId: string;
  sum?: number; // gesetzt => Summenzeile unten anzeigen
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  return (
    <div className="flex h-full min-w-0 flex-col">
      {title && (
        <div className="mb-1 flex items-center gap-1 px-1">
          <h3
            title={title}
            className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {title}
          </h3>
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? `${title} einklappen` : `${title} ausklappen`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
            >
              <IconChevronRight
                className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${
                  open ? "rotate-90" : ""
                }`}
              />
            </button>
          )}
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
          <AddEntry monthId={monthId} section={section} />
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
