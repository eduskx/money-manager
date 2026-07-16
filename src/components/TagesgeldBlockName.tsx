"use client";

import { type KeyboardEvent, useRef } from "react";
import { renameTagesgeldBlock } from "@/lib/actions";

// Editierbarer Name eines eigenen (CUSTOM) Tagesgeld-Blocks. Speichert beim
// Verlassen des Feldes oder mit Enter – gleiches Muster wie die Eintragszeilen.
// Die Textfarbe erbt vom farbigen Kartenkopf.
export function TagesgeldBlockName({
  blockId,
  name,
}: {
  blockId: string;
  name: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedName = useRef(name);

  function save() {
    const value = inputRef.current?.value.trim() ?? "";
    if (!value || value === savedName.current) return;
    savedName.current = value;
    formRef.current?.requestSubmit();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    }
  }

  return (
    <form ref={formRef} action={renameTagesgeldBlock} className="min-w-0 flex-1">
      <input type="hidden" name="id" value={blockId} />
      <input
        ref={inputRef}
        name="name"
        defaultValue={name}
        onBlur={save}
        onKeyDown={onKey}
        title={name}
        aria-label="Name des Blocks"
        className="w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-bold uppercase tracking-wide outline-none hover:border-black/10 focus:border-emerald-500 focus:bg-white/60 dark:hover:border-white/20 dark:focus:bg-black/20"
      />
    </form>
  );
}
