import type { ReactNode } from "react";
import { deleteCustomBlock, renameTagesgeldBlock } from "@/lib/actions";
import { formatEuro } from "@/lib/format";
import type { TagesgeldEntryView } from "@/lib/tagesgeld";
import { TagesgeldEntryRow } from "@/components/TagesgeldEntryRow";
import { TagesgeldAddEntry } from "@/components/TagesgeldAddEntry";
import { EditableName } from "@/components/EditableName";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { IconTrash } from "@/components/icons";
import { blockHeading, sumRow, tile } from "@/components/styles";

// Ein Block auf einer Sparkonto-Seite: Titel, Einträge, „Neuer Eintrag" und
// eine Summenzeile am Fuß. Optional mit Element rechts im Kopf (Jahres-
// Umschalter) und – für eigene Blöcke – Stift und Löschen-Knopf.
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

      <div className="mt-3 flex flex-1 flex-col">
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

        <div className={sumRow}>
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
