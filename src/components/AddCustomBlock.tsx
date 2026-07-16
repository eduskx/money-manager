import { addCustomBlock } from "@/lib/actions";
import { tileBase, tileHeading } from "@/components/styles";

// Legt einen eigenen (saldoneutralen) Block an, z. B. ETF, Aktien, Krypto.
// Sieht aus wie ein normaler Block, nur mit gestricheltem Rahmen und ohne
// eigene Fläche – so ist auf einen Blick klar, dass hier noch nichts ist.
//
// Ein Klick auf „Hinzufügen" legt den Block direkt als „Neuer Block" an –
// benannt wird er danach über den Stift im Blockkopf. Gleiches Prinzip wie bei
// den Ausgaben-Spalten und den Sparkonten: erst anlegen, dann benennen.
// Braucht deshalb keinen Client-State – ein Formular mit Server-Action reicht.
export function AddCustomBlock({ accountId }: { accountId: string }) {
  return (
    <form
      action={addCustomBlock}
      className={`${tileBase} border-dashed border-line shadow-none`}
    >
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="name" value="Neuer Block" />

      {/* min-h-9 hält den Kopf auf derselben Höhe wie bei den echten Blöcken,
          wo dort Stift und Papierkorb sitzen. */}
      <h2 className={`flex min-h-9 items-center ${tileHeading}`}>Neuer Block</h2>

      <p className="mt-3 text-sm text-muted">
        Eigene Blöcke (z. B. ETF, Aktien, Krypto) werden getrennt gezählt und
        beeinflussen den Saldo nicht.
      </p>

      <div className="mt-auto flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
