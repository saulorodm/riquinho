import type { Prisma } from "@prisma/client";

import { findCycleForDate } from "./cycle-service.js";

function addMonths(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + amount);
  return nextDate;
}

export async function buildInstallments(
  tx: Prisma.TransactionClient,
  {
    expenseId,
    userId,
    purchaseDate,
    amount,
    installmentsCount
  }: {
    expenseId: string;
    userId: string;
    purchaseDate: Date;
    amount: number;
    installmentsCount: number;
  }
) {
  const baseValue = Number((amount / installmentsCount).toFixed(2));
  const rawInstallments = Array.from({ length: installmentsCount }, (_value, index) => {
    const dueDate = addMonths(purchaseDate, index);
    const computedAmount =
      index === installmentsCount - 1
        ? Number((amount - baseValue * (installmentsCount - 1)).toFixed(2))
        : baseValue;

    return {
      installmentNumber: index + 1,
      dueDate,
      amount: computedAmount
    };
  });

  for (const installment of rawInstallments) {
    const cycle = await findCycleForDate(userId, installment.dueDate);

    await tx.expenseInstallment.create({
      data: {
        expenseId,
        installmentNumber: installment.installmentNumber,
        amount: installment.amount,
        dueDate: installment.dueDate,
        financialCycleId: cycle?.id
      }
    });
  }
}
