"use client";

import { useId } from "react";
import type { Section } from "@prisma/client";
import type { EntryView } from "@/lib/month";
import { deleteExpenseColumn, renameExpenseColumn } from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import { EntryRow } from "@/components/EntryRow";
import { AddEntry } from "@/components/AddEntry";
import { EditableName } from "@/components/EditableName";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { useCollapse } from "@/components/useCollapse";
import { IconChevronRight, IconTrash } from "@/components/icons";

// Eine Spalte/ein Abschnitt mit Einträgen, „Neuer Eintrag" und – optional –
// einer Summenzeile am Fuß.
//
// `column` ist nur bei Ausgaben gesetzt. Dann wird der Block zur abgesetzten
// Karte, bekommt einen Kopf mit Stift und Löschen-Knopf, und die Zeilen hängen
// an der Spalte (columnId) statt am Abschnitt.
//
// `share`: Anteil dieser Spalte an den Einnahmen in Prozent (0–100). Zeigt
// unter dem Kopf einen Balken. Er steht bewusst AUSSERHALB des Klappbereichs –
// so bleibt der Anteil auch bei eingeklappter Spalte sichtbar.
//
// `collapsible`: blendet einen Pfeil im Kopf ein, mit dem sich die Zeilen auf
// jeder Breite sanft ein- und ausklappen lassen (Summe/Balken bleiben sichtbar).
// Der Klappzustand hängt dann unter `collapseKey` am Nutzer (den vergibt die
// Seite – seitenbezogen, nicht pro Monat); `defaultOpen` ist der Startzustand
// aus der DB.
export function BudgetColumn({
  section,
  entries,
  monthId,
  sum,
  share,
  column,
  collapsible = false,
  collapseKey = "",
  defaultOpen = true,
}: {
  section: Section;
  entries: EntryView[];
  monthId: string;
  sum?: number; // gesetzt => Summenzeile unten anzeigen
  share?: number; // gesetzt => Anteilsbalken unter dem Kopf anzeigen
  column?: { id: string; name: string };
  collapsible?: boolean;
  collapseKey?: string;
  defaultOpen?: boolean;
}) {
  // Für die nicht-klappbaren Blöcke (Einnahmen, Abzüge) läuft der Hook mit einem
  // leeren Schlüssel leer mit – ihr Pfeil steht ohnehin im umschließenden
  // CollapsibleBlock.
  const { open, toggle } = useCollapse(collapseKey, defaultOpen);
  const bodyId = useId();

  // Ausgaben-Spalten sitzen auf `bg-sunken`; ihre Eingabefelder sollen dieselbe
  // Fläche tragen statt auf `bg-surface` herauszustechen. Einnahmen/Abzüge
  // haben keine Spalte und bleiben auf `bg-surface`.
  const onSunken = Boolean(column);

  return (
    <div
      className={`flex h-full min-w-0 flex-col ${
        column ? "rounded-xl bg-sunken p-3" : ""
      }`}
    >
      {column && (
        <div className="flex items-center gap-1">
          <EditableName
            id={column.id}
            name={column.name}
            action={renameExpenseColumn}
            ariaLabel="Name der Spalte"
            className="text-[13px] font-bold text-ink"
            iconClassName="text-faint"
          />

          {collapsible && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={
                open ? `${column.name} einklappen` : `${column.name} ausklappen`
              }
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-faint transition hover:bg-surface hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <IconTrash className="h-4 w-4" />
            </ConfirmSubmit>
          </form>
        </div>
      )}

      {/* Anteilsbalken: nur die Zahl rechts daneben, ohne Beschriftung. */}
      {typeof share === "number" && (
        <div className="mt-2 mb-0.5 flex items-center gap-2">
          <span className="bar-track h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
            />
          </span>
          <span className="shrink-0 text-[11px] font-bold text-muted tabular-nums">
            {Math.round(share)} %
          </span>
        </div>
      )}

      {/* Klappbereich: grid-rows 1fr<->0fr animiert die Höhe ohne feste Werte.
          Auf jeder Breite klappbar. */}
      <div
        id={bodyId}
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
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
                onSunken={onSunken}
              />
            ))}
          </div>
          <AddEntry
            monthId={monthId}
            section={section}
            columnId={column?.id ?? null}
            onSunken={onSunken}
          />
        </div>
      </div>

      {typeof sum === "number" && (
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t-2 border-accent/50 pt-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
            Summe
          </span>
          <span className="text-[15px] font-bold tabular-nums">
            {formatEuro(sum)}
          </span>
        </div>
      )}
    </div>
  );
}
