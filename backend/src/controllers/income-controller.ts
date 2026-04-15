import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { findCycleForDate } from "../services/cycle-service.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import { incomePayloadSchema } from "../validators/income-validator.js";

export async function listIncome(request: Request, response: Response) {
  const user = await getCurrentUser(request);
  const incomeEntries = await prisma.income.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      financialCycle: true
    },
    orderBy: { receivedAt: "desc" }
  });

  response.json(serializePrisma(incomeEntries));
}

export async function createIncome(request: Request, response: Response) {
  const payload = incomePayloadSchema.parse(request.body);
  const user = await getCurrentUser(request);
  const receivedAt = new Date(payload.receivedAt);
  const cycle =
    payload.financialCycleId
      ? await prisma.financialCycle.findFirst({
          where: { id: payload.financialCycleId, userId: user.id }
        })
      : await findCycleForDate(user.id, receivedAt);

  const income = await prisma.income.create({
    data: {
      userId: user.id,
      categoryId: payload.categoryId,
      financialCycleId: cycle?.id,
      sourceName: payload.sourceName,
      amount: payload.amount,
      receivedAt,
      notes: payload.notes
    },
    include: {
      category: true,
      financialCycle: true
    }
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(income));
}

export async function updateIncome(request: Request, response: Response) {
  const incomeId = String(request.params.id);
  const payload = incomePayloadSchema.parse(request.body);
  const user = await getCurrentUser(request);
  const receivedAt = new Date(payload.receivedAt);
  const existingIncome = await prisma.income.findFirstOrThrow({
    where: {
      id: incomeId,
      userId: user.id
    }
  });
  const cycle =
    payload.financialCycleId
      ? await prisma.financialCycle.findFirst({
          where: { id: payload.financialCycleId, userId: user.id }
        })
      : await findCycleForDate(user.id, receivedAt);

  const income = await prisma.income.update({
    where: { id: existingIncome.id },
    data: {
      categoryId: payload.categoryId,
      financialCycleId: cycle?.id,
      sourceName: payload.sourceName,
      amount: payload.amount,
      receivedAt,
      notes: payload.notes
    },
    include: {
      category: true,
      financialCycle: true
    }
  });

  response.json(serializePrisma(income));
}

export async function deleteIncome(request: Request, response: Response) {
  const incomeId = String(request.params.id);
  const user = await getCurrentUser(request);

  await prisma.income.deleteMany({
    where: {
      id: incomeId,
      userId: user.id
    }
  });

  response.status(StatusCodes.NO_CONTENT).send();
}
