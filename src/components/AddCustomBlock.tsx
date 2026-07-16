"use client";

import { useRef } from "react";
import { addCustomBlock } from "@/lib/actions";

// Legt einen eigenen (saldoneutralen) Block an, z. B. ETF, Aktien, Krypto.
// Sieht aus wie ein normaler Block, nur grau hinterlegt: Name im Kopf,
// Infotext im Körper, „Hinzufügen" unten rechts.
export function AddCustomBlock() {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await addCustomBlock(formData);
    const form = formRef.current;
    if (!form) return;
    form.reset();
    (form.elements.namedItem("name") as HTMLInputElement | null)?.focus();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex min-w-0 flex-col rounded-2xl border border-dashed border-gray-300 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-900/40"
    >
      <header className="flex h-14 items-center rounded-t-2xl bg-gray-100 px-4 dark:bg-gray-800/60">
        <input
          name="name"
          required
          placeholder="Neuer Block"
          aria-label="Name des neuen Blocks"
          className="w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-bold uppercase tracking-wide text-gray-700 outline-none placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
        />
      </header>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Eigene Blöcke (z. B. ETF, Aktien, Krypto) werden getrennt gezählt und
          beeinflussen den Saldo nicht.
        </p>

        <div className="mt-auto flex justify-end pt-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </form>
  );
}
