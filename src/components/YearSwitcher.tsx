"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const arrowClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

// Jahres-Umschalter für den Einnahmen-Block. Wechselt über die URL (?year=).
export function YearSwitcher({ year }: { year: number }) {
  const router = useRouter();
  const go = (y: number) => router.push(`/dashboard/tagesgeld?year=${y}`);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(year - 1)}
        aria-label="Vorheriges Jahr"
        className={arrowClass}
      >
        <IconChevronLeft />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums">
        {year}
      </span>
      <button
        type="button"
        onClick={() => go(year + 1)}
        aria-label="Nächstes Jahr"
        className={arrowClass}
      >
        <IconChevronRight />
      </button>
    </div>
  );
}
