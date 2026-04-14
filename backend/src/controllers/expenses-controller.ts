import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { findCycleForDate } from "../services/cycle-service.js";
import { buildInstallments } from "../services/installment-service.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import { expensePayloadSchema } from "../validators/expense-validator.js";

export async function listExpenses(_request: Request, response: Response) {
  const user = await getCurrentUser();
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      financialCycle: true,
      installments: {
        orderBy: { installmentNumber: "asc" }
      }
    },
    orderBy: { purchaseDate: "desc" }
  });

  response.json(serializePrisma(expenses));
}

export async function createExpense(request: Request, response: Response) {
  const payload = expensePayloadSchema.parse(request.body);
  const user = await getCurrentUser();
  const purchaseDate = new Date(payload.purchaseDate);
  const cycle =
    payload.financialCycleId
      ? await prisma.financialCycle.findFirst({
          where: { id: payload.financialCycleId, userId: user.id }
        })
      : await findCycleForDate(user.id, purchaseDate);

  const expense = await prisma.$transaction(async (tx) => {
    const createdExpense = await tx.expense.create({
      data: {
        userId: user.id,
        categoryId: payload.categoryId,
        financialCycleId: cycle?.id,
        expenseKind: payload.expenseKind,
        isRecurring: payload.isRecurring,
        title: payload.title,
        description: payload.description,
        amount: payload.amount,
        purchaseDate,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
        installmentsCount: payload.installmentsCount
      }
    });

    await buildInstallments(tx, {
      expenseId: createdExpense.id,
      userId: user.id,
      purchaseDate,
      amount: payload.amount,
      installmentsCount: payload.installmentsCount
    });

    return tx.expense.findUniqueOrThrow({
      where: { id: createdExpense.id },
      include: {
        installments: {
          orderBy: { installmentNumber: "asc" }
        },
        category: true,
        financialCycle: true
      }
    });
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(expense));
}

export async function updateExpense(request: Request, response: Response) {
  const expenseId = String(request.params.id);
  const payload = expensePayloadSchema.parse(request.body);
  const user = await getCurrentUser();
  const purchaseDate = new Date(payload.purchaseDate);
  const existingExpense = await prisma.expense.findFirstOrThrow({
    where: {
      id: expenseId,
      userId: user.id
    }
  });
  const cycle =
    payload.financialCycleId
      ? await prisma.financialCycle.findFirst({
          where: { id: payload.financialCycleId, userId: user.id }
        })
      : await findCycleForDate(user.id, purchaseDate);

  const expense = await prisma.$transaction(async (tx) => {
    await tx.expenseInstallment.deleteMany({
      where: {
        expenseId: existingExpense.id
      }
    });

    await tx.expense.update({
      where: { id: existingExpense.id },
      data: {
        categoryId: payload.categoryId,
        financialCycleId: cycle?.id,
        expenseKind: payload.expenseKind,
        isRecurring: payload.isRecurring,
        title: payload.title,
        description: payload.description,
        amount: payload.amount,
        purchaseDate,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
        installmentsCount: payload.installmentsCount
      }
    });

    await buildInstallments(tx, {
      expenseId: existingExpense.id,
      userId: user.id,
      purchaseDate,
      amount: payload.amount,
      installmentsCount: payload.installmentsCount
    });

    return tx.expense.findUniqueOrThrow({
      where: { id: existingExpense.id },
      include: {
        installments: {
          orderBy: { installmentNumber: "asc" }
        },
        category: true,
        financialCycle: true
      }
    });
  });

  response.json(serializePrisma(expense));
}

export async function deleteExpense(request: Request, response: Response) {
  const expenseId = String(request.params.id);
  const user = await getCurrentUser();

  await prisma.expense.deleteMany({
    where: {
      id: expenseId,
      userId: user.id
    }
  });

  response.status(StatusCodes.NO_CONTENT).send();
}
