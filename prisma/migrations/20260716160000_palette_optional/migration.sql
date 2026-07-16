-- Die Farbwelt wird nullbar: null = „der Nutzer hat noch nie eine gewählt".
--
-- Vorher hatte die Spalte NOT NULL DEFAULT 'INDIGO'. Damit war nicht mehr zu
-- unterscheiden, ob jemand Indigo bewusst ausgesucht hatte oder es nur vom
-- Default bekam. Der Standard gehört deshalb nicht in die DB, sondern in den
-- Code (DEFAULT_PALETTE in src/lib/palette.ts) – dort lässt er sich ändern,
-- ohne bestehende Zeilen anzufassen.

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "palette" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "palette" DROP DEFAULT;

-- Alle bestehenden INDIGO-Werte stammen aus dem DEFAULT der vorherigen
-- Migration (20260716150000_user_palette), nicht aus einer Entscheidung des
-- Nutzers – die Farbwelten gab es zu dem Zeitpunkt noch keinen Tag. Deshalb
-- zurück auf „nie gewählt", damit der neue Standard greift.
--
-- ACHTUNG: Wer Indigo zwischenzeitlich bewusst ausgewählt hat, muss danach
-- einmal neu wählen. Bei allen anderen Welten bleibt die Wahl erhalten.
UPDATE "User" SET "palette" = NULL WHERE "palette" = 'INDIGO';
