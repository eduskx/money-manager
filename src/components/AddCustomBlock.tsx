"use client";

import { useRef } from "react";
import { addCustomBlock } from "@/lib/actions";
import { IconPlus } from "@/components/icons";

// Legt einen eigenen (saldoneutralen) Block an, z. B. ETF, Aktien, Krypto.
export function AddCustomBlock() {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await addCustomBlock(formData);
    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex min-w-0 items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white/50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
    >
      <input
        name="name"
        required
        placeholder="Neuer Block (z. B. ETF, Krypto) …"
        aria-label="Name des neuen Blocks"
        className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
      />
      <button
        type="submit"
        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <IconPlus className="h-4 w-4" />
        Block
      </button>
    </form>
  );
}
