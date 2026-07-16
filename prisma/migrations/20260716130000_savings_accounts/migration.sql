-- Sparkonten: Tagesgeld-Blöcke hängen künftig an einem Konto statt direkt am
-- User (User -> SavingsAccount -> TagesgeldBlock -> TagesgeldEntry).
--
-- Reihenfolge kritisch: erst Konten anlegen und die Blöcke umhängen, danach
-- erst die alte userId-Verknüpfung entfernen.

-- CreateTable
CREATE TABLE "SavingsAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SavingsAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsAccount_userId_idx" ON "SavingsAccount"("userId");

-- AddForeignKey
ALTER TABLE "SavingsAccount" ADD CONSTRAINT "SavingsAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Datenrettung: Jeder User mit bestehenden Blöcken bekommt sein bisheriges
-- Tagesgeld als Konto „Tagesgeld".
INSERT INTO "SavingsAccount" ("id", "name", "position", "createdAt", "userId")
SELECT gen_random_uuid()::text, 'Tagesgeld', 0, CURRENT_TIMESTAMP, u."id"
FROM "User" u
WHERE EXISTS (SELECT 1 FROM "TagesgeldBlock" b WHERE b."userId" = u."id");

-- AlterTable
ALTER TABLE "TagesgeldBlock" ADD COLUMN "accountId" TEXT;

-- Bestehende Blöcke an das Konto ihres Users hängen.
UPDATE "TagesgeldBlock" b
SET "accountId" = a."id"
FROM "SavingsAccount" a
WHERE a."userId" = b."userId";

-- Sicherheitsnetz: Blöcke ohne Konto (dürfte es nach dem UPDATE nicht geben)
-- entfernen, damit die NOT-NULL-Bedingung greifen kann.
DELETE FROM "TagesgeldBlock" WHERE "accountId" IS NULL;

ALTER TABLE "TagesgeldBlock" ALTER COLUMN "accountId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "TagesgeldBlock_accountId_idx" ON "TagesgeldBlock"("accountId");

-- AddForeignKey
ALTER TABLE "TagesgeldBlock" ADD CONSTRAINT "TagesgeldBlock_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SavingsAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alte Verknüpfung zum User entfernen.
ALTER TABLE "TagesgeldBlock" DROP CONSTRAINT "TagesgeldBlock_userId_fkey";
DROP INDEX "TagesgeldBlock_userId_idx";
ALTER TABLE "TagesgeldBlock" DROP COLUMN "userId";
