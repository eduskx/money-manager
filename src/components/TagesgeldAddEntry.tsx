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
    const form = formRef.current;
    if (!form) return;
    form.reset();
    // Cursor zurück ins Namensfeld, damit man direkt die nächste Zeile tippt.
    (form.elements.namedItem("label") as HTMLInputElement | null)?.focus();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-1 flex min-w-0 items-center gap-1 border-t border-dashed border-gray-200 pt-2 dark:border-gray-800"
    >
      <input type="hidden" name="blockId" value={blockId} />
      {year !== null && <input type="hidden" name="year" value={year} />}
      <input
        name="label"
        required
        placeholder="Neuer Eintrag"
        aria-label="Bezeichnung der neuen Zeile"
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:bg-gray-800"
      />
      <input
        name="amount"
        inputMode="text"
        placeholder="0,00"
        aria-label="Betrag der neuen Zeile (Rechenformeln wie =60+30 erlaubt)"
        className="w-20 shrink-0 rounded-md border border-transparent bg-transparent px-2 py-2 text-right text-sm text-gray-900 tabular-nums outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:bg-gray-800"
      />
      <button
        type="submit"
        aria-label="Zeile hinzufügen"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-emerald-600 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
      >
        <IconPlus />
      </button>
    </form>
  );
}
