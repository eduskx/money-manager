-- Gast-Konten: per Klick angelegte, anonyme Nutzer mit Beispieldaten.
--
-- Der Default `false` gilt zugleich für neue Registrierungen und rückwirkend
-- für alle bestehenden Nutzer – die sind alle echt.
--
-- Der Index ist der Grund, warum das Aufräumen billig bleibt: Beim nächsten
-- Gast-Login löscht `deleteExpiredGuests` alle Gäste, die älter als
-- GUEST_TTL_DAYS sind (src/lib/guest.ts). Ohne Index wäre das ein Full Scan
-- über alle Nutzer, mit Index trifft er genau die abgelaufenen Gäste.
-- Alles Weitere (Monate, Einträge, Sparkonten) hängt per ON DELETE CASCADE
-- daran und verschwindet mit.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_isGuest_createdAt_idx" ON "User"("isGuest", "createdAt");
