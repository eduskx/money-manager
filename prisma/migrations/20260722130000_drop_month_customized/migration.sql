-- Entfernt das `customized`-Flag.
--
-- Es hatte genau EINEN Zweck: unberührte Monate zu markieren, damit der
-- automatische Vorlagen-Sync (applyTemplateToMonths) sie mitziehen konnte. Diese
-- Regel gibt es nicht mehr – eine Vorlage-Änderung wirkt sich nicht mehr auf
-- bestehende Monate aus; wer die neue Vorlage in einem Monat haben will, löscht
-- ihn und legt ihn über „Vorlage importieren" neu an. Damit ist das Flag ohne
-- Leser und fällt weg.

-- AlterTable
ALTER TABLE "Month" DROP COLUMN "customized";
