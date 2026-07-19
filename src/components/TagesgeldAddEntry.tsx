"use client";

import { useRef } from "react";
import { addTagesgeldEntry } from "@/lib/actions";
import { IconPlus } from "@/components/icons";

// Neue Zeile in einem Tagesgeld-Block. `year` wird nur beim Einnahmen-Block
// gesetzt (der Eintrag gehört dann zum aktuell gewählten Jahr).
export function TagesgeldAddEntry({
  blockId,
  year = null,
}: {
  blockId: string;
  year?: number | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await addTagesgeldEntry(formData);
    // Formular leeren, aber den Fokus nicht ins nächste Feld setzen.
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-1 flex min-w-0 items-center gap-1 border-t border-dashed border-line pt-2"
    >
      <input type="hidden" name="blockId" value={blockId} />
      {year !== null && <input type="hidden" name="year" value={year} />}
      <input
        name="label"
        required
        placeholder="Neuer Eintrag"
        aria-label="Bezeichnung der neuen Zeile"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent focus:bg-surface"
      />
      <input
        name="amount"
        inputMode="text"
        placeholder="0,00"
        aria-label="Betrag der neuen Zeile (Rechenformeln wie =60+30 erlaubt)"
        className="w-20 shrink-0 rounded-md border border-transparent bg-transparent px-2 py-2 text-right text-sm text-ink tabular-nums outline-none placeholder:text-faint focus:border-accent focus:bg-surface"
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
