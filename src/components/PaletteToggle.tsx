"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Palette } from "@prisma/client";
import { setPalette } from "@/lib/actions";
import { paletteAttr, PALETTE_LABELS, PALETTE_ORDER } from "@/lib/palette";
import { IconCheck, IconPalette } from "@/components/icons";

// Öffnet ein Menü mit allen Farbwelten – die aktive ist mit einem Haken
// markiert. Früher schaltete der Knopf im Kreis eine weiter; das war schnell,
// aber bei sieben Welten zum Ansteuern einer bestimmten umständlich.
//
// Beim Auswählen passiert zweierlei, und die Reihenfolge ist Absicht:
//  1. data-palette auf <html> sofort setzen -> die Farben wechseln unmittelbar,
//     ohne auf den Server zu warten. Die Tokens in globals.css hängen an diesem
//     Attribut, deshalb reicht das eine Attribut für die ganze Seite.
//  2. Danach die Server-Action, die die Wahl am Nutzer speichert. Sie läuft in
//     einer Transition, damit der Klick nicht blockiert.
//
// Bewusst OHNE Farb-Kacheln je Welt: Farbwerte gehören ausschließlich in
// globals.css. Sieben Vorschau-Farben gleichzeitig zu zeigen hieße, sie hier zu
// hinterlegen – dieselbe Regel, an der die restliche App festhält.
//
// `palette` ist der Wert aus der DB (vom Server gerendert) und dient nur als
// Startwert – ab der ersten Auswahl führt der lokale State.
export function PaletteToggle({ palette }: { palette: Palette }) {
  const [current, setCurrent] = useState<Palette>(palette);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  // Schließen bei Klick nach außen oder mit Escape – das erwartet man von einem
  // Menü, und ohne diese beiden Wege bliebe es hängen.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node | null)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Palette) {
    setOpen(false);
    if (next === current) return;
    setCurrent(next);
    // setAttribute statt `dataset.palette = …`: ein Methodenaufruf, kein
    // Zuweisen an ein Objekt von außerhalb – nur so trägt es die
    // Immutability-Regel des React-Compilers mit. Wirkung ist dieselbe.
    document.documentElement.setAttribute("data-palette", paletteAttr(next));
    startTransition(() => {
      setPalette(next);
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Farbwelt wählen – aktuell ${PALETTE_LABELS[current]}`}
        title={`Farbwelt: ${PALETTE_LABELS[current]}`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <IconPalette className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Farbwelt"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg"
        >
          {PALETTE_ORDER.map((p) => {
            const active = p === current;
            return (
              <button
                key={p}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(p)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active ? "font-semibold text-accent" : "text-ink"
                }`}
              >
                {/* Vorschau-Punkt in der Akzentfarbe der Welt (Klasse aus
                    globals.css, hell/dunkel-fähig). */}
                <span
                  aria-hidden
                  className={`h-3.5 w-3.5 shrink-0 rounded-full border border-line/60 swatch-${paletteAttr(
                    p,
                  )}`}
                />
                <span className="min-w-0 flex-1 truncate">
                  {PALETTE_LABELS[p]}
                </span>
                {active && <IconCheck className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
