"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { deleteEntry, updateEntry } from "@/lib/actions";
import { parseAmount } from "@/lib/calc";
import { formatAmountInput, formatEuro } from "@/lib/format";
import { IconCheck, IconTrash } from "@/components/icons";

// Eine bearbeitbare Zeile (Bezeichnung + Betrag).
//
// Excel-Metapher fürs Betragsfeld: Die schmale Zelle zeigt immer das ERGEBNIS.
// Klickt man hinein, klappt darunter ein breites Feld auf – die „Formelzeile" –
// in dem man die Rechnung bequem eintippt (z. B. „=5,70+10,20") und das
// Ergebnis live mitläuft. Enter/Haken übernimmt, Escape verwirft.
// `onSunken`: In den Ausgaben-Spalten (Fläche `bg-sunken`) sollen die
// aufklappenden Eingabefelder dieselbe Fläche tragen wie die Spalte, statt auf
// `bg-surface` herauszustechen – wie bei den normalen Blöcken, wo Feld und Block
// ohnehin `bg-surface` teilen.
export function EntryRow({
  id,
  label,
  amount,
  formula,
  onSunken = false,
}: {
  id: string;
  label: string;
  amount: number;
  formula: string | null;
  onSunken?: boolean;
}) {
  const [, startTransition] = useTransition();
  // Die Fläche, auf der der Block sitzt – als Fokus-Hintergrund der Felder und
  // als Füllung der Formelzeile.
  const surface = onSunken ? "bg-sunken" : "bg-surface";
  const focusSurface = onSunken ? "focus:bg-sunken" : "focus:bg-surface";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  // Ob gerade IRGENDEIN Feld dieser Zeile den Fokus hat -> Haken statt Mülleimer.
  const [rowFocused, setRowFocused] = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const bigRef = useRef<HTMLInputElement>(null); // das aufgeklappte, breite Feld
  const savedLabel = useRef(label);

  const resultText = formatAmountInput(amount); // Zelle im Ruhezustand
  const currentExpr = formula ?? resultText; // Startwert der Formelzeile
  const liveValue = editing ? parseAmount(draft) : null; // Live-Ergebnis

  function submitRow(amountRaw: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("label", labelRef.current?.value.trim() ?? label);
    fd.set("amount", amountRaw);
    startTransition(() => updateEntry(fd));
  }

  // --- Bezeichnung ---
  function saveLabel() {
    const value = labelRef.current?.value.trim() ?? "";
    if (!value || value === savedLabel.current) return;
    savedLabel.current = value;
    submitRow(currentExpr); // Betrag/Formel unverändert lassen
  }

  // --- Betrag / Formel ---
  // Klick in die Zelle: Formelzeile aufklappen und den Fokus dorthin legen.
  function openEditor() {
    if (editing) return;
    setDraft(currentExpr);
    setEditing(true);
    requestAnimationFrame(() => {
      bigRef.current?.focus();
      bigRef.current?.select();
    });
  }
  function changeAmount(e: ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value);
  }
  function commitAmount() {
    if (!editing) return;
    setEditing(false);
    const next = draft.trim();
    if (next === currentExpr.trim()) return; // nichts geändert
    submitRow(next);
  }

  function labelKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveLabel();
    }
  }
  function bigKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAmount();
      bigRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditing(false); // verwerfen
      bigRef.current?.blur();
    }
  }

  // Verlässt der Fokus die Zeile GANZ, Haken weg – und ein offener Editor wird
  // übernommen (wie „daneben tippen").
  function rowBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setRowFocused(false);
      commitAmount();
    }
  }

  // Haken: speichern und Fokus aus der Zeile nehmen.
  function confirm() {
    commitAmount();
    saveLabel();
    labelRef.current?.blur();
    amountRef.current?.blur();
    bigRef.current?.blur();
    setRowFocused(false);
  }

  return (
    <div
      className="group flex min-w-0 flex-col gap-1"
      onFocus={() => setRowFocused(true)}
      onBlur={rowBlur}
    >
      <div className="flex min-w-0 items-center gap-1">
        <input
          ref={labelRef}
          defaultValue={label}
          onBlur={saveLabel}
          onKeyDown={labelKey}
          aria-label="Bezeichnung"
          title={label}
          className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-ink outline-none hover:border-line focus:border-accent ${focusSurface}`}
        />
        {/* Die Zelle: zeigt das Ergebnis, ist selbst nicht tippbar (readOnly) –
            getippt wird in der Formelzeile darunter. */}
        <input
          ref={amountRef}
          value={
            editing
              ? liveValue === null
                ? "…"
                : formatAmountInput(liveValue)
              : resultText
          }
          readOnly
          onFocus={openEditor}
          onClick={openEditor}
          inputMode="none"
          aria-label="Betrag in Euro – zum Bearbeiten anklicken"
          title={formula ? `Formel: ${formula}` : undefined}
          className={`w-20 shrink-0 cursor-pointer rounded-md border border-transparent bg-transparent px-2 py-2 text-right text-sm text-ink tabular-nums outline-none hover:border-line focus:border-accent ${focusSurface}`}
        />

        {rowFocused ? (
          // onMouseDown verhindert, dass der Klick zuerst das Feld verlässt –
          // sonst wäre `editing` schon vorbei, bevor confirm() den Entwurf liest.
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={confirm}
            aria-label="Änderung übernehmen"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-accent transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <IconCheck className="h-4 w-4" />
          </button>
        ) : (
          <form action={deleteEntry} className="shrink-0">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              aria-label={`Zeile „${label}“ löschen`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-faint transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:hover:bg-red-950/40 dark:hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      {/* Die aufklappende Formelzeile: breites Feld + Live-Ergebnis. */}
      {editing && (
        <div className={`rounded-md border border-line ${surface} p-2`}>
          <input
            ref={bigRef}
            value={draft}
            onChange={changeAmount}
            onKeyDown={bigKey}
            inputMode="text"
            aria-label="Betrag oder Rechnung eingeben"
            placeholder="z. B. =5,70+10,20"
            className="w-full rounded border border-line bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
          />
          <div className="mt-1 flex items-center justify-between px-1 text-xs">
            <span className="text-muted">Ergebnis</span>
            <span className="font-semibold text-ink tabular-nums">
              {liveValue === null ? "—" : formatEuro(liveValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
