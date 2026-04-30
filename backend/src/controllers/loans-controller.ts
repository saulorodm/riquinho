import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import { loanInstallmentStatusSchema, loanPayloadSchema } from "../validators/loans-validator.js";

function buildInstallmentDates(firstInstallmentDate: Date, dueDay: number, installmentsCount: number) {
  const dates: Date[] = [];
  let year = firstInstallmentDate.getUTCFullYear();
  let month = firstInstallmentDate.getUTCMonth();

  dates.push(
    new Date(
      Date.UTC(
        year,
        month,
        firstInstallmentDate.getUTCDate(),
        0,
        0,
        0,
        0
      )
    )
  );

  month += 1;
  if (month > 11) {
    month = 0;
    year += 1;
  }

  for (let index = 1; index < installmentsCount; index += 1) {
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const safeDay = Math.min(dueDay, lastDayOfMonth);
    dates.push(new Date(Date.UTC(year, month, safeDay, 0, 0, 0, 0)));

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return dates;
}

function splitInstallments(principalAmount: number, installmentsCount: number) {
  const totalInCents = Math.round(principalAmount * 100);
  const baseInstallment = Math.floor(totalInCents / installmentsCount);
  const remainder = totalInCents - baseInstallment * installmentsCount;

  return Array.from({ length: installmentsCount }, (_, index) => {
    const installmentInCents = baseInstallment + (index === installmentsCount - 1 ? remainder : 0);
    return installmentInCents / 100;
  });
}

export async function listLoans(request: Request, response: Response) {
  const user = await getCurrentUser(request);
  const loans = await prisma.loan.findMany({
    where: { userId: user.id },
    include: {
      installments: {
        orderBy: { installmentNumber: "asc" }
      }
    },
    orderBy: { startDate: "desc" }
  });

  response.json(serializePrisma(loans));
}

export async function createLoan(request: Request, response: Response) {
  const payload = loanPayloadSchema.parse(request.body);
  const user = await getCurrentUser(request);
  const startDate = new Date(payload.startDate);
  const firstInstallmentDate = new Date(payload.firstInstallmentDate);
  const installments = splitInstallments(payload.principalAmount, payload.installmentsCount);
  const dueDates = buildInstallmentDates(firstInstallmentDate, payload.dueDay, payload.installmentsCount);
  const installmentAmount = installments[0] ?? payload.principalAmount;

  const loan = await prisma.loan.create({
    data: {
      user: {
        connect: {
          id: user.id
        }
      },
      borrowerName: payload.borrowerName,
      principalAmount: payload.principalAmount,
      installmentAmount,
      dueDay: payload.dueDay,
      installmentsCount: payload.installmentsCount,
      startDate,
      firstInstallmentDate,
      notes: payload.notes,
      installments: {
        create: installments.map((amount, index) => ({
          installmentNumber: index + 1,
          amount,
          dueDate: dueDates[index]
        }))
      }
    },
    include: {
      installments: {
        orderBy: { installmentNumber: "asc" }
      }
    }
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(loan));
}

export async function deleteLoan(request: Request, response: Response) {
  const loanId = String(request.params.id);
  const user = await getCurrentUser(request);

  await prisma.loan.deleteMany({
    where: {
      id: loanId,
      userId: user.id
    }
  });

  response.status(StatusCodes.NO_CONTENT).send();
}

export async function toggleLoanInstallment(request: Request, response: Response) {
  const installmentId = String(request.params.installmentId);
  const payload = loanInstallmentStatusSchema.parse(request.body);
  const user = await getCurrentUser(request);

  const installment = await prisma.loanInstallment.findFirstOrThrow({
    where: {
      id: installmentId,
      loan: {
        userId: user.id
      }
    },
    include: {
      loan: true
    }
  });

  const updatedInstallment = await prisma.loanInstallment.update({
    where: { id: installment.id },
    data: {
      paidAt: payload.isPaid ? new Date() : null
    }
  });

  response.json(serializePrisma(updatedInstallment));
}
