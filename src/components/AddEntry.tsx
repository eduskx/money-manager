"use client";

import { useRef } from "react";
import type { Section } from "@prisma/client";
import { addEntry } from "@/lib/actions";
import { IconPlus } from "@/components/icons";

// Formular zum Anlegen einer neuen Zeile in einem Abschnitt. Nach dem Speichern
// wird das Formular geleert – der Fokus wandert aber bewusst NICHT ins nächste
// Feld: Der Cursor soll nach dem Anlegen nichts Neues anvisieren.
//
// `columnId` wird nur bei Ausgaben gesetzt – dort gehört jede Zeile in eine
// konkrete (frei benannte) Spalte.
export function AddEntry({
  monthId,
  section,
  columnId = null,
  onSunken = false,
}: {
  monthId: string;
  section: Section;
  columnId?: string | null;
  onSunken?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // In den Ausgaben-Spalten (bg-sunken) trägt auch dieses Feld dieselbe Fläche,
  // damit es nicht auf bg-surface heraussticht – wie bei EntryRow.
  const focusSurface = onSunken ? "focus:bg-sunken" : "focus:bg-surface";

  async function action(formData: FormData) {
    await addEntry(formData);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-1 flex min-w-0 items-center gap-1 border-t border-dashed border-line pt-2"
    >
      <input type="hidden" name="monthId" value={monthId} />
      <input type="hidden" name="section" value={section} />
      {columnId && <input type="hidden" name="columnId" value={columnId} />}
      <input
        name="label"
        required
        placeholder="Neuer Eintrag"
        aria-label="Bezeichnung der neuen Zeile"
        className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent ${focusSurface}`}
      />
      <input
        name="amount"
        inputMode="text"
        placeholder="0,00"
        aria-label="Betrag der neuen Zeile (Rechenformeln wie =60+30 erlaubt)"
        className={`w-20 shrink-0 rounded-md border border-transparent bg-transparent px-2 py-2 text-right text-sm text-ink tabular-nums outline-none placeholder:text-faint focus:border-accent ${focusSurface}`}
      />
      <button
        type="submit"
        aria-label="Zeile hinzufügen"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-accent transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <IconPlus />
      </button>
    </form>
  );
}
