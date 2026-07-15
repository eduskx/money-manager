-- Das flache Transaction-Modell wird durch das Monats-/Block-Modell ersetzt.

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropTable
DROP TABLE "Transaction";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('INCOME', 'FIXKOSTEN', 'ALLTAG', 'LUXUS', 'RUECKLAGE');

-- CreateTable
CREATE TABLE "Month" (
    "id" TEXT NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monthId" TEXT NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Month_userId_idx" ON "Month"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Month_userId_year_month_key" ON "Month"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "Entry_monthId_idx" ON "Entry"("monthId");

-- AddForeignKey
ALTER TABLE "Month" ADD CONSTRAINT "Month_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month"("id") ON DELETE CASCADE ON UPDATE CASCADE;
