-- Farbwelt der Oberfläche, pro Nutzer gespeichert.
--
-- Der Default INDIGO gilt für beides zugleich: für neue Registrierungen (die
-- Spalte wird beim INSERT nicht mitgegeben) und – dank des DEFAULT beim
-- ADD COLUMN – rückwirkend für alle bestehenden Nutzer. Genau das ist die
-- Anforderung: „wer noch nie auf die Palette getippt hat, sieht Indigo".

-- CreateEnum
CREATE TYPE "Palette" AS ENUM ('GRAPHIT', 'INDIGO', 'MARINE', 'SALBEI', 'PFLAUME', 'SAND');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "palette" "Palette" NOT NULL DEFAULT 'INDIGO';
