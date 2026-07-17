-- Neue Farbwelt „Rosé". Ein zusätzlicher Enum-Wert – bestehende Nutzer und
-- ihre gewählten Welten sind davon nicht betroffen.
--
-- `ADD VALUE` allein (ohne den Wert in derselben Transaktion zu benutzen) ist
-- auf modernem Postgres transaktionssicher; Prisma führt die Migration wie
-- gewohnt aus. Die Farben selbst stehen NICHT hier, sondern in globals.css.

-- AlterEnum
ALTER TYPE "Palette" ADD VALUE 'ROSE';
