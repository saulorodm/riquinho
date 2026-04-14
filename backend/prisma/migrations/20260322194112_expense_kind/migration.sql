-- CreateEnum
CREATE TYPE "ExpenseKind" AS ENUM ('OPERATIONAL', 'EXTRAORDINARY');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "expenseKind" "ExpenseKind" NOT NULL DEFAULT 'OPERATIONAL';
