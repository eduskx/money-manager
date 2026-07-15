-- Alle bereits befüllten echten Monate als „bearbeitet" schützen, damit der
-- Vorlagen-Sync (applyTemplateToMonths) sie nicht überschreibt. Nötig für
-- Monate, die vor dem customized-Flag mit echten Daten angelegt wurden.
-- Wirklich leere Monate (keine Einträge) bleiben customized = false und werden
-- künftig automatisch aus der Vorlage befüllt.
UPDATE "Month" AS m
SET "customized" = true
WHERE m."isTemplate" = false
  AND EXISTS (SELECT 1 FROM "Entry" e WHERE e."monthId" = m."id");
