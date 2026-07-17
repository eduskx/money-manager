"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

const arrowClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

// Monatsnavigation: Pfeile für vor/zurück und ein Klick auf die Mitte öffnet
// ein Popover zur direkten Auswahl von Monat und Jahr. Der Wechsel läuft über
// die URL (?y=&m=). Angesteuerte Monate werden NICHT mehr automatisch
// angelegt – ein leerer Monat zeigt „Vorlage importieren".
//
// maxYear/maxMonth: am weitesten wählbarer Monat (ein Monat nach dem echten
// aktuellen Monat). Alles danach ist gesperrt.
//
// generatedKeys: die Monate, die es schon gibt (Vorlage importiert). Sie
// werden im Raster farblich markiert. Format „2026-7" – MUSS zu monthKey()
// aus lib/month.ts passen; direkt importieren geht nicht, weil month.ts
// Prisma lädt und damit nicht in den Browser darf.
export function MonthSwitcher({
  year,
  month,
  maxYear,
  maxMonth,
  generatedKeys = [],
}: {
  year: number;
  month: number;
  maxYear: number;
  maxMonth: number;
  generatedKeys?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  // Popover öffnen/schließen. Beim Öffnen startet der Jahres-Stepper immer beim
  // aktuell angezeigten Jahr; danach kann man frei durch die Jahre blättern.
  function toggle() {
    if (!open) setPickerYear(year);
    setOpen((o) => !o);
  }

  // Popover bei Klick außerhalb oder Escape schließen.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  // Liegt (y, m) hinter dem erlaubten Grenz-Monat?
  const isBeyondMax = (y: number, m: number) =>
    y > maxYear || (y === maxYear && m > maxMonth);
  const canGoNext = !isBeyondMax(next.y, next.m);

  const go = (y: number, m: number) => {
    if (isBeyondMax(y, m)) return;
    setOpen(false);
    router.push(`/dashboard?y=${y}&m=${m}`);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(prev.y, prev.m)}
        aria-label="Vorheriger Monat"
        className={arrowClass}
      >
        <IconChevronLeft />
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="min-w-[9.5rem] rounded-lg border border-transparent px-3 py-2 text-center text-base font-semibold text-ink tabular-nums transition hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {MONTH_NAMES[month - 1]} {year}
      </button>

      <button
        type="button"
        onClick={() => go(next.y, next.m)}
        disabled={!canGoNext}
        aria-label="Nächster Monat"
        title={canGoNext ? undefined : "Weiter in der Zukunft nicht möglich"}
        className={`${arrowClass} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent`}
      >
        <IconChevronRight />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Monat auswählen"
          className="absolute left-1/2 top-full z-40 mt-2 w-64 -translate-x-1/2 rounded-xl border border-line bg-surface p-3 shadow-lg"
        >
          {/* Jahres-Stepper */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              aria-label="Jahr zurück"
              className={arrowClass}
            >
              <IconChevronLeft />
            </button>
            <span className="text-base font-semibold text-ink tabular-nums">
              {pickerYear}
            </span>
            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              aria-label="Jahr vor"
              className={arrowClass}
            >
              <IconChevronRight />
            </button>
          </div>

          {/* Monatsraster. Rangfolge der Zustände: ausgewählt schlägt alles,
              dann gesperrt, dann „schon erzeugt" (getönte Akzentfläche),
              zuletzt der neutrale Rest. */}
          <div className="grid grid-cols-3 gap-1">
            {MONTH_SHORT.map((name, i) => {
              const m = i + 1;
              const isSelected = pickerYear === year && m === month;
              const isDisabled = isBeyondMax(pickerYear, m);
              const isGenerated = generatedKeys.includes(`${pickerYear}-${m}`);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => go(pickerYear, m)}
                  disabled={isDisabled}
                  aria-current={isSelected ? "true" : undefined}
                  title={isGenerated && !isSelected ? "Bereits erstellt" : undefined}
                  className={
                    isSelected
                      ? "rounded-lg bg-accent px-2 py-2 text-sm font-medium text-on-accent"
                      : isDisabled
                        ? "cursor-not-allowed rounded-lg px-2 py-2 text-sm text-faint opacity-50"
                        : isGenerated
                          ? "rounded-lg bg-accent/15 px-2 py-2 text-sm font-medium text-accent transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          : "rounded-lg px-2 py-2 text-sm text-ink transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
