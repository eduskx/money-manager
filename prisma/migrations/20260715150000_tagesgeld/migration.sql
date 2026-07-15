-- Tagesgeld-Seite (Phase 2): Blöcke + Einträge.

-- CreateEnum
CREATE TYPE "TagesgeldKind" AS ENUM ('EINNAHMEN', 'AUSGABEN', 'ZURUECKGELEGT', 'CUSTOM');

-- CreateTable
CREATE TABLE "TagesgeldBlock" (
    "id" TEXT NOT NULL,
    "kind" "TagesgeldKind" NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TagesgeldBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagesgeldEntry" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "year" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockId" TEXT NOT NULL,

    CONSTRAINT "TagesgeldEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TagesgeldBlock_userId_idx" ON "TagesgeldBlock"("userId");

-- CreateIndex
CREATE INDEX "TagesgeldEntry_blockId_idx" ON "TagesgeldEntry"("blockId");

-- AddForeignKey
ALTER TABLE "TagesgeldBlock" ADD CONSTRAINT "TagesgeldBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagesgeldEntry" ADD CONSTRAINT "TagesgeldEntry_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "TagesgeldBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
