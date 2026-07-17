"use client";

import { useState, useTransition } from "react";
import { setCarryOver } from "@/lib/actions";

// Schalter für den Vormonats-Übertrag.
//
// Wie beim Paletten-Icon: Der Schalter springt sofort um, das Speichern läuft
// in einer Transition hinterher. Sonst würde der Knopf einen Wimpernschlag
// lang in der alten Stellung hängen, obwohl man ihn schon umgelegt hat.
//
// `checked` ist der Wert aus der DB und dient nur als Startwert – ab dem
// ersten Klick führt der lokale State.
export function CarryOverSwitch({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(() => {
      setCarryOver(next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2.5 rounded-lg border border-line px-3 text-sm font-medium text-ink transition hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
    >
      {/* Die Bahn. Der Knubbel darin wandert per translate-x – deshalb braucht
          weder Bahn noch Knubbel eine feste Position. */}
      <span
        aria-hidden
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-surface shadow-sm transition-transform motion-reduce:transition-none ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      Vormonat übertragen
    </button>
  );
}
