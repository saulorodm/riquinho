import { StatusCodes } from "http-status-codes";
import { InvestmentType } from "@prisma/client";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { syncInvestmentMarketPrice, syncUserInvestmentQuotes } from "../services/market-price-service.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import {
  investmentContributionPayloadSchema,
  investmentPositionUpdatePayloadSchema
} from "../validators/investment-validator.js";

function isQuotaBased(assetType: InvestmentType) {
  return assetType !== InvestmentType.FIXED_INCOME && assetType !== InvestmentType.CASH_RESERVE;
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function listInvestments(_request: Request, response: Response) {
  const user = await getCurrentUser();
  await syncUserInvestmentQuotes(user.id);
  const investments = await prisma.investment.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      snapshots: {
        orderBy: { capturedAt: "asc" }
      }
    },
    orderBy: { investedAt: "desc" }
  });

  response.json(serializePrisma(investments));
}

export async function createInvestment(request: Request, response: Response) {
  const payload = investmentContributionPayloadSchema.parse(request.body);
  const user = await getCurrentUser();
  const quotaBased = isQuotaBased(payload.assetType);
  const contributionAmount = quotaBased
    ? Number((payload.quantity! * payload.unitPrice!).toFixed(2))
    : payload.amountInvested!;
  const manualCurrentValue = payload.assetType === InvestmentType.FIXED_INCOME
    ? payload.currentValue!
    : payload.assetType === InvestmentType.CASH_RESERVE
      ? payload.currentValue!
      : contributionAmount;
  const manualNetCurrentValue = payload.assetType === InvestmentType.FIXED_INCOME
    ? payload.netCurrentValue!
    : payload.assetType === InvestmentType.CASH_RESERVE
      ? payload.netCurrentValue!
      : contributionAmount;
  const existingInvestment = await prisma.investment.findFirst({
    where: {
      userId: user.id,
      name: payload.name,
      assetType: payload.assetType
    }
  });

  const investment = await prisma.$transaction(async (tx) => {
    if (existingInvestment) {
      const nextAmountInvested = toNumber(existingInvestment.amountInvested) + contributionAmount;
      const nextQuantity = quotaBased
        ? toNumber(existingInvestment.quantity) + Number(payload.quantity)
        : null;
      const nextCurrentQuantity = quotaBased
        ? toNumber(existingInvestment.currentQuantity ?? existingInvestment.quantity) + Number(payload.quantity)
        : null;
      const nextAverageUnitPrice =
        quotaBased && nextQuantity
          ? Number((nextAmountInvested / nextQuantity).toFixed(4))
          : null;
      const nextCurrentValue = quotaBased
        ? Number((toNumber(existingInvestment.currentValue ?? existingInvestment.amountInvested) + contributionAmount).toFixed(2))
        : Number((manualCurrentValue).toFixed(2));
      const nextNetCurrentValue = quotaBased
        ? nextCurrentValue
        : Number((manualNetCurrentValue).toFixed(2));

      await tx.investment.update({
        where: { id: existingInvestment.id },
        data: {
          amountInvested: nextAmountInvested,
          quantity: nextQuantity,
          currentQuantity: nextCurrentQuantity,
          averageUnitPrice: nextAverageUnitPrice,
          currentValue: nextCurrentValue,
          netCurrentValue: nextNetCurrentValue,
          investedAt: new Date(payload.investedAt),
          notes: payload.notes ?? existingInvestment.notes
        }
      });

      await tx.investmentSnapshot.create({
        data: {
          investmentId: existingInvestment.id,
          value: nextCurrentValue,
          capturedAt: new Date()
        }
      });

      const refreshedInvestment = await tx.investment.findUniqueOrThrow({
        where: { id: existingInvestment.id },
        include: {
          category: true,
          snapshots: {
            orderBy: { capturedAt: "asc" }
          }
        }
      });

      return quotaBased
        ? syncInvestmentMarketPrice(refreshedInvestment, tx)
        : refreshedInvestment;
    }

    const createdInvestment = await tx.investment.create({
      data: {
        userId: user.id,
        name: payload.name,
        assetType: payload.assetType,
        amountInvested: contributionAmount,
        quantity: quotaBased ? payload.quantity : null,
        currentQuantity: quotaBased ? payload.quantity : null,
        averageUnitPrice: quotaBased ? payload.unitPrice : null,
        currentValue: quotaBased ? contributionAmount : manualCurrentValue,
        netCurrentValue: quotaBased ? contributionAmount : manualNetCurrentValue,
        investedAt: new Date(payload.investedAt),
        notes: payload.notes,
        snapshots: {
          create: {
            value: quotaBased ? contributionAmount : manualCurrentValue,
            capturedAt: new Date()
          }
        }
      },
      include: {
        category: true,
        snapshots: true
      }
    });

    return quotaBased
      ? syncInvestmentMarketPrice(createdInvestment, tx)
      : createdInvestment;
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(investment));
}

export async function updateInvestment(request: Request, response: Response) {
  const investmentId = String(request.params.id);
  const payload = investmentPositionUpdatePayloadSchema.parse(request.body);
  const user = await getCurrentUser();
  const existingInvestment = await prisma.investment.findFirstOrThrow({
    where: {
      id: investmentId,
      userId: user.id
    }
  });

  const investment = await prisma.$transaction(async (tx) => {
    await tx.investmentSnapshot.deleteMany({
      where: {
        investmentId: existingInvestment.id
      }
    });

    await tx.investment.update({
      where: { id: existingInvestment.id },
      data: {
        amountInvested:
          existingInvestment.assetType === InvestmentType.FIXED_INCOME ||
          existingInvestment.assetType === InvestmentType.CASH_RESERVE
            ? payload.amountInvested ?? existingInvestment.amountInvested
            : existingInvestment.amountInvested,
        currentValue:
          existingInvestment.assetType === InvestmentType.FIXED_INCOME ||
          existingInvestment.assetType === InvestmentType.CASH_RESERVE
            ? payload.currentValue
            : existingInvestment.currentValue,
        netCurrentValue:
          existingInvestment.assetType === InvestmentType.FIXED_INCOME ||
          existingInvestment.assetType === InvestmentType.CASH_RESERVE
            ? payload.netCurrentValue ?? payload.currentValue
            : existingInvestment.netCurrentValue,
        currentQuantity: existingInvestment.assetType === InvestmentType.FIXED_INCOME ||
          existingInvestment.assetType === InvestmentType.CASH_RESERVE
          ? null
          : payload.currentQuantity,
        notes: payload.notes ?? existingInvestment.notes
      }
    });

    const updatedInvestment = await tx.investment.findUniqueOrThrow({
      where: { id: existingInvestment.id },
      include: {
        category: true,
        snapshots: {
          orderBy: { capturedAt: "asc" }
        }
      }
    });

    if (
      existingInvestment.assetType === InvestmentType.FIXED_INCOME ||
      existingInvestment.assetType === InvestmentType.CASH_RESERVE
    ) {
      await tx.investmentSnapshot.create({
        data: {
          investmentId: existingInvestment.id,
          value: payload.currentValue ?? existingInvestment.currentValue ?? existingInvestment.amountInvested,
          capturedAt: new Date()
        }
      });

      return updatedInvestment;
    }

    return syncInvestmentMarketPrice(updatedInvestment, tx);
  });

  response.json(serializePrisma(investment));
}

export async function deleteInvestment(request: Request, response: Response) {
  const investmentId = String(request.params.id);
  const user = await getCurrentUser();

  await prisma.investment.deleteMany({
    where: {
      id: investmentId,
      userId: user.id
    }
  });

  response.status(StatusCodes.NO_CONTENT).send();
}
