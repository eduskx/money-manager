"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

const arrowClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:disabled:hover:bg-transparent";

// Jahres-Umschalter für die Blöcke „Einnahmen" und „Ausgaben" eines Kontos.
// Beide steuern dasselbe Jahr (URL `?year=`).
//
// `maxYear`: das echte aktuelle Jahr – weiter in die Zukunft geht es nicht.
export function YearSwitcher({
  accountId,
  year,
  maxYear,
}: {
  accountId: string;
  year: number;
  maxYear: number;
}) {
  const router = useRouter();

  const canGoNext = year < maxYear;
  const go = (y: number) => {
    if (y > maxYear) return;
    router.push(`/dashboard/sparkonten/${accountId}?year=${y}`);
  };

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
        disabled={!canGoNext}
        aria-label="Nächstes Jahr"
        title={canGoNext ? undefined : "Weiter in der Zukunft nicht möglich"}
        className={arrowClass}
      >
        <IconChevronRight />
      </button>
    </div>
  );
}
