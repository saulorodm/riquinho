ALTER TABLE "Loan"
ADD COLUMN "firstInstallmentDate" TIMESTAMP(3);

UPDATE "Loan"
SET "firstInstallmentDate" = "startDate"
WHERE "firstInstallmentDate" IS NULL;

ALTER TABLE "Loan"
ALTER COLUMN "firstInstallmentDate" SET NOT NULL;
