ALTER TABLE "User"
ADD COLUMN "cycleStartDay" INTEGER,
ADD COLUMN "cycleEndDay" INTEGER;

UPDATE "User"
SET "cycleStartDay" = COALESCE("cycleStartDay", 21),
    "cycleEndDay" = COALESCE("cycleEndDay", 20);

CREATE UNIQUE INDEX "FinancialCycle_userId_startDate_endDate_key"
ON "FinancialCycle"("userId", "startDate", "endDate");
