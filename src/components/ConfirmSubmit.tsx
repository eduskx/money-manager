"use client";

import type { ReactNode } from "react";

// Submit-Button mit Sicherheitsabfrage. Sitzt in einem <form action={…}>. Bricht
// der Nutzer die Rückfrage ab, wird das Absenden verhindert. Für destruktive
// Aktionen (Löschen), damit nichts versehentlich passiert.
export function ConfirmSubmit({
  message,
  children,
  className,
}: {
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
