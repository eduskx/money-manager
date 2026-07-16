-- Flexible, frei benennbare Ausgaben-Spalten statt fester Enum-Werte.
--
-- Reihenfolge ist kritisch: erst die Spalten anlegen und die vorhandenen
-- Einträge zuordnen, ERST DANACH das Enum umstellen. Postgres erlaubt kein
-- `ALTER TYPE ... ADD VALUE`, das in derselben Transaktion benutzt wird –
-- deshalb wird der Typ am Ende ausgetauscht statt erweitert.

-- CreateTable
CREATE TABLE "ExpenseColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monthId" TEXT NOT NULL,

    CONSTRAINT "ExpenseColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseColumn_monthId_idx" ON "ExpenseColumn"("monthId");

-- AddForeignKey
ALTER TABLE "ExpenseColumn" ADD CONSTRAINT "ExpenseColumn_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "columnId" TEXT;

-- CreateIndex
CREATE INDEX "Entry_columnId_idx" ON "Entry"("columnId");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "ExpenseColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Datenrettung: Jeder bestehende Monat (inkl. Vorlage) behält seine bisherigen
-- drei Spalten – auch leere, damit die Ansicht exakt gleich bleibt.
INSERT INTO "ExpenseColumn" ("id", "name", "position", "createdAt", "monthId")
SELECT gen_random_uuid()::text, v.name, v.pos, CURRENT_TIMESTAMP, m."id"
FROM "Month" m
CROSS JOIN (VALUES
  ('Fixkosten', 0),
  ('Einkäufe / Essen / Leben', 1),
  ('Luxus', 2)
) AS v(name, pos);

-- Bestehende Ausgaben-Einträge ihrer neuen Spalte zuordnen.
UPDATE "Entry" e
SET "columnId" = c."id"
FROM "ExpenseColumn" c
WHERE c."monthId" = e."monthId"
  AND (
    (e."section"::text = 'FIXKOSTEN' AND c."position" = 0)
    OR (e."section"::text = 'ALLTAG' AND c."position" = 1)
    OR (e."section"::text = 'LUXUS' AND c."position" = 2)
  );

-- Enum austauschen: FIXKOSTEN/ALLTAG/LUXUS werden zu EXPENSE.
CREATE TYPE "Section_new" AS ENUM ('INCOME', 'EXPENSE', 'RUECKLAGE');

ALTER TABLE "Entry" ALTER COLUMN "section" TYPE "Section_new"
  USING (
    CASE
      WHEN "section"::text IN ('FIXKOSTEN', 'ALLTAG', 'LUXUS') THEN 'EXPENSE'
      ELSE "section"::text
    END
  )::"Section_new";

DROP TYPE "Section";
ALTER TYPE "Section_new" RENAME TO "Section";
