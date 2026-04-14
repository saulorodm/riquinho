ALTER TYPE "InvestmentType" ADD VALUE IF NOT EXISTS 'CRYPTO';

ALTER TABLE "Investment"
ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(16,4),
ADD COLUMN IF NOT EXISTS "currentQuantity" DECIMAL(16,4),
ADD COLUMN IF NOT EXISTS "averageUnitPrice" DECIMAL(12,4);

CREATE UNIQUE INDEX IF NOT EXISTS "Investment_userId_name_assetType_key"
ON "Investment"("userId", "name", "assetType");
