"use client";

import { useState, useTransition } from "react";
import type { Palette } from "@prisma/client";
import { setPalette } from "@/lib/actions";
import { nextPalette, paletteAttr, PALETTE_LABELS } from "@/lib/palette";
import { IconPalette } from "@/components/icons";

// Schaltet die Farbwelt der Oberfläche eine weiter (im Kreis).
//
// Zwei Dinge passieren bei einem Klick, und die Reihenfolge ist Absicht:
//  1. data-palette auf <html> sofort setzen -> die Farben wechseln unmittelbar,
//     ohne auf den Server zu warten. Die Tokens in globals.css hängen an diesem
//     Attribut, deshalb reicht das eine Attribut für die ganze Seite.
//  2. Danach die Server-Action, die die Wahl am Nutzer speichert. Sie läuft in
//     einer Transition, damit der Klick nicht blockiert.
//
// `palette` ist der Wert aus der DB (vom Server gerendert) und dient nur als
// Startwert – ab dem ersten Klick führt der lokale State.
export function PaletteToggle({ palette }: { palette: Palette }) {
  const [current, setCurrent] = useState<Palette>(palette);
  const [, startTransition] = useTransition();

  function cycle() {
    const next = nextPalette(current);
    setCurrent(next);
    document.documentElement.dataset.palette = paletteAttr(next);
    startTransition(() => {
      setPalette(next);
    });
  }

  const upcoming = PALETTE_LABELS[nextPalette(current)];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Farbwelt wechseln – aktuell ${PALETTE_LABELS[current]}, weiter zu ${upcoming}`}
      title={`Farbwelt: ${PALETTE_LABELS[current]}`}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <IconPalette className="h-5 w-5" />
    </button>
  );
}
