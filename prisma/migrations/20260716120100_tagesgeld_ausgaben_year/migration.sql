-- Tagesgeld: Der Ausgaben-Block bekommt jetzt (wie die Einnahmen) einen
-- Jahres-Umschalter. Bestehende Ausgaben-Einträge haben year = NULL und würden
-- damit aus jeder Jahresansicht verschwinden -> auf ihr Erstellungsjahr setzen.
--
-- Rücklagen und eigene (CUSTOM) Blöcke bleiben bewusst ohne Jahr, sie zählen
-- konto-gesamt.
UPDATE "TagesgeldEntry" te
SET "year" = EXTRACT(YEAR FROM te."createdAt")::int
FROM "TagesgeldBlock" b
WHERE b."id" = te."blockId"
  AND b."kind" = 'AUSGABEN'
  AND te."year" IS NULL;
