"use client";

import { type ReactNode, useId, useState } from "react";
import { IconChevronRight } from "@/components/icons";

// Ein Block mit ausklappbarem Körper und einem Pfeil im Kopf – für die Blöcke,
// die keinen eigenen Spaltenkopf haben (Einnahmen, Abzüge). Ausgaben-Spalten
// bringen ihre Klapp-Logik selbst mit (BudgetColumn), die Sparkonto-Blöcke
// ebenfalls (TagesgeldBlockCard); dieselbe Mechanik, nur an einem Ort, an dem
// der Kopf nicht editierbar ist.
//
// `heading`  – die Überschrift (bleibt immer sichtbar, neben dem Pfeil).
// `summary`  – optional, bleibt beim Einklappen ebenfalls sichtbar (z. B. die
//              große Einnahmen-Zahl). Nur der `children`-Körper klappt weg.
export function CollapsibleBlock({
  heading,
  summary,
  defaultOpen = true,
  children,
}: {
  heading: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? "Block einklappen" : "Block ausklappen"}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-faint transition hover:bg-surface hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <IconChevronRight
            className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${
              open ? "rotate-90" : ""
            }`}
          />
        </button>
        <div className="min-w-0 flex-1">{heading}</div>
      </div>

      {summary}

      <div
        id={bodyId}
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
