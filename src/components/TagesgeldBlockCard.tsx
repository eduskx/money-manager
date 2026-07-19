"use client";

import { type ReactNode, useId, useState } from "react";
import { deleteCustomBlock, renameTagesgeldBlock } from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import type { TagesgeldEntryView } from "@/lib/tagesgeld";
import { TagesgeldEntryRow } from "@/components/TagesgeldEntryRow";
import { TagesgeldAddEntry } from "@/components/TagesgeldAddEntry";
import { EditableName } from "@/components/EditableName";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { IconChevronRight, IconTrash } from "@/components/icons";
import { blockHeading, tile } from "@/components/styles";

// Ein Block auf einer Sparkonto-Seite: Titel, Einträge, „Neuer Eintrag" und
// eine Summenzeile am Fuß. Optional mit Element rechts im Kopf (Jahres-
// Umschalter) und – für eigene Blöcke – Stift und Löschen-Knopf.
//
// Klappbar auf jeder Breite (Pfeil im Kopf): Nur die Einträge klappen weg,
// Titel und Summe bleiben stehen. Die beiden Saldo-Kacheln der Kontoseite sind
// bewusst KEINE solchen Blöcke und deshalb nicht klappbar.
//
// Alle Blöcke sehen bewusst gleich aus; früher hatte jeder einen eigenen
// farbigen Kopf (grün, orange, amber, indigo). Das vertrug sich nicht mit den
// Farbwelten – jetzt trägt der Titel die Unterscheidung, wie bei den
// Ausgaben-Spalten im Dashboard auch.
export function TagesgeldBlockCard({
  title,
  blockId,
  entries,
  sum,
  addYear = null,
  headerRight,
  deletable = false,
  editableName = false,
}: {
  title: string;
  blockId: string;
  entries: TagesgeldEntryView[];
  sum: number;
  addYear?: number | null;
  headerRight?: ReactNode;
  deletable?: boolean;
  editableName?: boolean; // eigene Blöcke: Name über den Stift bearbeitbar
}) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  return (
    <section className={tile}>
      <div className="flex min-h-9 items-center gap-1">
        {editableName ? (
          <EditableName
            id={blockId}
            name={title}
            action={renameTagesgeldBlock}
            ariaLabel="Name des Blocks"
            className={blockHeading}
            iconClassName="text-faint"
          />
        ) : (
          <h2 title={title} className={`min-w-0 flex-1 truncate ${blockHeading}`}>
            {title}
          </h2>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {headerRight}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={open ? `${title} einklappen` : `${title} ausklappen`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition hover:bg-sunken hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <IconChevronRight
              className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${
                open ? "rotate-90" : ""
              }`}
            />
          </button>
          {deletable && (
            <form action={deleteCustomBlock}>
              <input type="hidden" name="id" value={blockId} />
              <ConfirmSubmit
                message={`Block „${title}“ mit allen Einträgen wirklich löschen?`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-faint transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <IconTrash className="h-4 w-4" />
              </ConfirmSubmit>
            </form>
          )}
        </div>
      </div>

      {/* Klappbereich: Einträge + „Neuer Eintrag". Die Summe darunter bleibt
          immer sichtbar (sie ist die Zusammenfassung des Blocks). */}
      <div
        id={bodyId}
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-0.5">
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
        </div>
      </div>

      {/* mt-auto pinnt die Summe an den unteren Rand der (ggf. gestreckten)
          Karte; pt-4 hält immer einen Abstand über der Trennlinie – so liegt
          die Linie nie direkt unter dem eingeklappten Kopf, wo bei Einnahmen
          und Ausgaben die Jahres-Pfeile sitzen. */}
      <div className="mt-auto pt-4">
        <div className="flex items-baseline justify-between gap-2 border-t-2 border-accent/50 pt-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
            Summe
          </span>
          <span className="text-[15px] font-bold tabular-nums">
            {formatEuro(sum)}
          </span>
        </div>
      </div>
    </section>
  );
}
