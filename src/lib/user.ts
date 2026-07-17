import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Der angemeldete Nutzer – EINMAL pro Anfrage aus der DB geholt.
//
// Warum das nötig ist: Am Dashboard hängen vier Stellen, die den Nutzer
// brauchen – das Root-Layout (Farbwelt), das Dashboard-Layout (existiert er
// noch?), die Seite selbst (Anzeigename) und HeaderTools (Farbwelt). Jede hat
// ihn sich vorher selbst geholt: vier Abfragen, viermal derselbe Weg zur
// Datenbank nach Frankfurt, rund 150 ms für Daten, die nach der ersten
// Abfrage schon vollständig dalagen.
//
// `cache` von React löst das: Der erste Aufruf innerhalb einer Anfrage führt
// die Abfrage aus, alle weiteren bekommen dasselbe Ergebnis zurück, ohne die
// DB anzufassen. Über Anfragen hinweg wird NICHTS behalten – zwei Nutzer sehen
// sich also niemals gegenseitig, und eine Änderung ist beim nächsten Aufruf
// sofort sichtbar.
//
// Deshalb holt die Abfrage bewusst alle Felder auf einmal, die irgendwo
// gebraucht werden: Eine Abfrage mit fünf Spalten kostet genauso viel wie eine
// mit einer – die Zeit steckt im Weg, nicht in der Datenmenge.
export const getSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      palette: true,
      carryOver: true,
      isGuest: true,
      createdAt: true,
    },
  });
});
