"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { deleteTagesgeldEntry, updateTagesgeldEntry } from "@/lib/actions";
import { formatAmountInput } from "@/lib/format";
import { IconTrash } from "@/components/icons";

// Wie EntryRow (Budget): Betragsfeld zeigt im Ruhezustand das Ergebnis, beim
// Reinklicken die Formel. Speichern per onBlur oder Enter.
export function TagesgeldEntryRow({
  id,
  label,
  amount,
  formula,
}: {
  id: string;
  label: string;
  amount: number;
  formula: string | null;
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);
  const savedLabel = useRef(label);

  const resultText = formatAmountInput(amount);
  const currentExpr = formula ?? resultText;

  function submitRow(amountRaw: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("label", labelRef.current?.value.trim() ?? label);
    fd.set("amount", amountRaw);
    startTransition(() => updateTagesgeldEntry(fd));
  }

  function saveLabel() {
    const value = labelRef.current?.value.trim() ?? "";
    if (!value || value === savedLabel.current) return;
    savedLabel.current = value;
    submitRow(currentExpr);
  }

  function focusAmount(e: FocusEvent<HTMLInputElement>) {
    setDraft(currentExpr);
    setEditing(true);
    const el = e.currentTarget;
    requestAnimationFrame(() => el.select());
  }
  function changeAmount(e: ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value);
    if (!editing) setEditing(true);
  }
  function commitAmount() {
    if (!editing) return;
    setEditing(false);
    const next = draft.trim();
    if (next === currentExpr.trim()) return;
    submitRow(next);
  }

  function labelKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveLabel();
    }
  }
  function amountKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAmount();
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  }

  return (
    <div className="group flex min-w-0 items-center gap-1">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <input
          ref={labelRef}
          defaultValue={label}
          onBlur={saveLabel}
          onKeyDown={labelKey}
          aria-label="Bezeichnung"
          title={label}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-gray-900 outline-none hover:border-gray-200 focus:border-emerald-500 focus:bg-white dark:text-gray-100 dark:hover:border-gray-700 dark:focus:bg-gray-800"
        />
        <input
          value={editing ? draft : resultText}
          onFocus={focusAmount}
          onChange={changeAmount}
          onBlur={commitAmount}
          onKeyDown={amountKey}
          inputMode="text"
          aria-label="Betrag in Euro (Rechenformeln wie =13+3 erlaubt)"
          title={formula ? `Formel: ${formula}` : undefined}
          className="w-20 shrink-0 rounded-md border border-transparent bg-transparent px-2 py-2 text-right text-sm text-gray-900 tabular-nums outline-none hover:border-gray-200 focus:border-emerald-500 focus:bg-white dark:text-gray-100 dark:hover:border-gray-700 dark:focus:bg-gray-800"
        />
      </div>

      <form action={deleteTagesgeldEntry} className="shrink-0">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={`Zeile „${label}“ löschen`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-300 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-gray-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
