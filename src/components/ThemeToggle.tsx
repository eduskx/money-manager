"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "@/components/icons";

// Ob der Dark-Mode aktiv ist, steht als `dark`-Klasse auf <html>. Das ist ein
// „externer" Zustand außerhalb von React – dafür ist useSyncExternalStore
// gedacht: `subscribe` meldet Änderungen, `getSnapshot` liest den aktuellen
// Wert. So brauchen wir kein setState-im-useEffect und bleiben synchron.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

// Auf dem Server (SSR) gibt es kein `document`; das Inline-Script im Layout
// setzt das Theme ohnehin erst im Browser. Server-Standard: hell.
function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage kann blockiert sein – dann bleibt es bei der Session.
    }
    // Die Klassenänderung löst den MutationObserver aus -> Neu-Render.
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      title={dark ? "Heller Modus" : "Dunkler Modus"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
