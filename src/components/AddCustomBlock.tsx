import { addCustomBlock } from "@/lib/actions";

// Legt einen eigenen (saldoneutralen) Block an, z. B. ETF, Aktien, Krypto.
// Sieht aus wie ein normaler Block, nur grau hinterlegt.
//
// Ein Klick auf „Hinzufügen" legt den Block direkt als „Neuer Block" an –
// benannt wird er danach über den Stift im Blockkopf. Gleiches Prinzip wie bei
// den Ausgaben-Spalten und den Sparkonten: erst anlegen, dann benennen.
// Braucht deshalb keinen Client-State – ein Formular mit Server-Action reicht.
export function AddCustomBlock({ accountId }: { accountId: string }) {
  return (
    <form
      action={addCustomBlock}
      className="flex min-w-0 flex-col rounded-2xl border border-dashed border-gray-300 bg-gray-50 shadow-sm dark:border-gray-700 dark:bg-gray-900/40"
    >
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="name" value="Neuer Block" />

      <header className="flex h-14 items-center rounded-t-2xl bg-gray-100 px-4 dark:bg-gray-800/60">
        <h2 className="truncate text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Neuer Block
        </h2>
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
