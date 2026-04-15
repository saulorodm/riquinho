import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { getAvailableCycles, getCurrentCycle } from "../services/cycle-service.js";
import { syncUserInvestmentQuotes } from "../services/market-price-service.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

export async function getDashboard(request: Request, response: Response) {
  const user = await getCurrentUser(request);
  await syncUserInvestmentQuotes(user.id);
  const requestedCycleId =
    typeof request.query.cycleId === "string" && request.query.cycleId.length > 0
      ? request.query.cycleId
      : undefined;
  const availableCycles = await getAvailableCycles(user.id);
  const cycle = requestedCycleId
    ? (await prisma.financialCycle.findFirst({
        where: {
          id: requestedCycleId,
          userId: user.id
        }
      })) ?? (await getCurrentCycle(user.id))
    : await getCurrentCycle(user.id);

  if (!cycle) {
    response.json({
      cycle: null,
      availableCycles,
      metrics: {
        totalIncome: 0,
        totalExpenses: 0,
        remainingBudget: 0,
        totalInvested: 0,
        currentPortfolioValue: 0
      },
      cycleSummary: {
        operationalExpenses: 0,
        extraordinaryExpenses: 0,
        patrimonialExpenses: 0,
        operationalBalance: 0,
        netCashFlow: 0
      },
      expenseByCategory: [],
      investmentAllocation: [],
      monthlyOverview: []
    });
    return;
  }

  const [incomeAggregate, installments, investments, categories] = await Promise.all([
    prisma.income.aggregate({
      where: {
        userId: user.id,
        financialCycleId: cycle.id
      },
      _sum: {
        amount: true
      }
    }),
    prisma.expenseInstallment.findMany({
      where: {
        financialCycleId: cycle.id
      },
      include: {
        expense: {
          select: {
            categoryId: true,
            expenseKind: true,
            category: true
          }
        }
      }
    }),
    prisma.investment.findMany({
      where: { userId: user.id }
    }),
    prisma.category.findMany({
      where: {
        userId: user.id,
        type: "EXPENSE"
      }
    })
  ]);

  const totalIncome = toNumber(incomeAggregate._sum.amount);
  const totalExpenses = installments.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const operationalExpenses = installments
    .filter((item) => item.expense.expenseKind === "OPERATIONAL")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const extraordinaryExpenses = installments
    .filter((item) => item.expense.expenseKind === "EXTRAORDINARY")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const patrimonialExpenses = installments
    .filter((item) => item.expense.expenseKind === "PATRIMONIAL")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalInvested = investments.reduce((sum, item) => sum + toNumber(item.amountInvested), 0);
  const currentPortfolioValue = investments.reduce(
    (sum, item) => sum + toNumber(item.netCurrentValue ?? item.currentValue ?? item.amountInvested),
    0
  );

  const expenseByCategory = Object.values(
    installments.reduce<Record<string, { name: string; value: number }>>((accumulator, item) => {
      const key = item.expense.category?.name ?? "Sem categoria";
      const current = accumulator[key] ?? { name: key, value: 0 };
      current.value += toNumber(item.amount);
      accumulator[key] = current;
      return accumulator;
    }, {})
  );

  const investmentAllocation = Object.values(
    investments.reduce<Record<string, { name: string; value: number }>>((accumulator, item) => {
      const key = item.assetType;
      const current = accumulator[key] ?? { name: key, value: 0 };
      current.value += toNumber(item.netCurrentValue ?? item.currentValue ?? item.amountInvested);
      accumulator[key] = current;
      return accumulator;
    }, {})
  );

  const categoryBudgets = categories.map((category) => {
    const spent = installments
      .filter((item) => item.expense.categoryId === category.id && item.expense.expenseKind === "OPERATIONAL")
      .reduce((sum, item) => sum + toNumber(item.amount), 0);

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      budgetCeiling: toNumber(category.budgetCeiling),
      spent
    };
  });

  const monthlyOverview = [
    {
      name: "Entradas",
      value: totalIncome
    },
    {
      name: "Saídas",
      value: totalExpenses
    }
  ];

  const upcomingInstallments = await prisma.expenseInstallment.findMany({
    where: {
      dueDate: {
        gt: cycle.endDate
      }
    },
    include: {
      expense: true,
      financialCycle: true
    },
    orderBy: {
      dueDate: "asc"
    },
    take: 6
  });

  response.json(serializePrisma({
    cycle,
    availableCycles,
    metrics: {
      totalIncome,
      totalExpenses,
      remainingBudget: totalIncome - totalExpenses,
      totalInvested,
      currentPortfolioValue
    },
    cycleSummary: {
      operationalExpenses,
      extraordinaryExpenses,
      patrimonialExpenses,
      operationalBalance: totalIncome - operationalExpenses,
      netCashFlow: totalIncome - totalExpenses
    },
    expenseByCategory,
    investmentAllocation,
    monthlyOverview,
    categoryBudgets,
    upcomingInstallments
  }));
}
