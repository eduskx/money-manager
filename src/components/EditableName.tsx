"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { IconPencil } from "@/components/icons";

// Ein Name/eine Überschrift, die ERST nach Klick auf den Stift bearbeitbar wird.
// Vorher ist es normaler Text – dadurch ist auf einen Blick klar, was bearbeitbar
// ist und was nicht.
//
// Die Regel in der App: Werte (Zeilen, Beträge) bearbeitet man direkt, Namen und
// Überschriften über den Stift. Diese Komponente ist der eine Ort dafür, damit
// das Verhalten überall gleich bleibt – auf Handy wie am PC.
//
// Beim Aktivieren springt der Cursor ins Feld und markiert alles. Gespeichert
// wird beim Verlassen des Feldes oder mit Enter; Escape verwirft.
export function EditableName({
  id,
  name,
  action,
  ariaLabel,
  className = "",
  iconClassName = "",
}: {
  id: string;
  name: string;
  action: (formData: FormData) => void;
  ariaLabel: string;
  className?: string; // Typo/Farbe – Text und Feld teilen sie sich
  iconClassName?: string; // Stift-Farbe, passend zum jeweiligen Kopf
}) {
  const [editing, setEditing] = useState(false);
  const [display, setDisplay] = useState(name);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setEditing(true);
    // Das Feld existiert erst nach dem Render.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  function save() {
    const value = inputRef.current?.value.trim() ?? "";
    // Reihenfolge wichtig: erst absenden (das Feld steht noch im Formular),
    // dann den Bearbeitungsmodus verlassen.
    if (value && value !== display) {
      setDisplay(value);
      formRef.current?.requestSubmit();
    }
    setEditing(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (inputRef.current) inputRef.current.value = display;
      setEditing(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <form ref={formRef} action={action} className="min-w-0 flex-1">
        <input type="hidden" name="id" value={id} />
        {editing ? (
          <input
            ref={inputRef}
            name="name"
            defaultValue={display}
            onBlur={save}
            onKeyDown={onKey}
            aria-label={ariaLabel}
            className={`w-full min-w-0 rounded-md border border-accent bg-surface px-2 py-1 outline-none ${className}`}
          />
        ) : (
          <span
            title={display}
            className={`block min-w-0 truncate border border-transparent px-2 py-1 ${className}`}
          >
            {display}
          </span>
        )}
      </form>

      <button
        type="button"
        onClick={startEdit}
        aria-label={`${ariaLabel} bearbeiten`}
        title="Umbenennen"
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition hover:bg-surface hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${iconClassName}`}
      >
        <IconPencil className="h-4 w-4" />
      </button>
    </div>
  );
}
