-- Merkt sich pro Nutzer, welche Blöcke eingeklappt sind.
--
-- Gespeichert werden nur die EINGEKLAPPTEN Blöcke (als Liste von Schlüsseln);
-- fehlt ein Schlüssel, ist der Block offen. Der Default `[]` bildet damit genau
-- das bisherige Verhalten ab: Vor dieser Migration war alles offen – bestehende
-- Nutzer starten also unverändert mit lauter offenen Blöcken.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "collapsed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
