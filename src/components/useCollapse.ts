"use client";

import { useState, useTransition } from "react";
import { setBlockCollapsed } from "@/lib/actions";

// Gemeinsame Klapp-Logik für alle Blöcke: hält den Zustand lokal und speichert
// ihn nebenbei am Nutzer. Ein Ort dafür, damit sich CollapsibleBlock,
// BudgetColumn und TagesgeldBlockCard exakt gleich verhalten.
//
// Optimistisch wie der Farbwelten-Toggle: `open` schaltet sofort um, die
// Server-Action läuft in einer Transition hinterher und blockiert den Klick
// nicht. Gespeichert wird der EINGEKLAPPTE Zustand (collapsed = !open) – offen
// ist der Normalfall und braucht keinen Eintrag.
export function useCollapse(blockKey: string, defaultOpen: boolean) {
  const [open, setOpen] = useState(defaultOpen);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    startTransition(() => setBlockCollapsed(blockKey, !next));
  }

  return { open, toggle };
}
