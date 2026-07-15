-- Kennzeichen, ob ein Monat vom Nutzer bearbeitet wurde (steuert den Vorlagen-Sync).
ALTER TABLE "Month" ADD COLUMN "customized" BOOLEAN NOT NULL DEFAULT false;

-- Der „Saldo aus Vormonat" wird ab jetzt dynamisch berechnet statt gespeichert.
-- Alte, fest gespeicherte Übertrags-Zeilen entfernen, damit nichts doppelt zählt.
DELETE FROM "Entry" WHERE "label" = 'Saldo aus Vormonat';
