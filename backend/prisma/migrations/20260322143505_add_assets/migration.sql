-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('VEHICLE', 'RESIDENCE', 'INCOME_PROPERTY', 'LAND', 'BUSINESS_EQUITY', 'OTHER');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "acquisitionValue" DECIMAL(10,2),
    "currentValue" DECIMAL(10,2) NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_userId_acquiredAt_idx" ON "Asset"("userId", "acquiredAt");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
