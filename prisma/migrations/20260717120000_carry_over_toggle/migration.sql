-- Schalter für den Vormonats-Übertrag.
--
-- Der Default `true` bildet genau das bisherige Verhalten ab: Bis jetzt floss
-- der Restbetrag immer in den Folgemonat. Bestehende Nutzer merken von dieser
-- Migration deshalb nichts – sie bekommen nur die Möglichkeit, es abzustellen.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "carryOver" BOOLEAN NOT NULL DEFAULT true;
