import { PrismaClient, CategoryType, InvestmentType, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "owner@riquinho.local" },
    update: {},
    create: {
      name: "Usuário Principal",
      email: "owner@riquinho.local"
    }
  });

  const cycles = [
    {
      name: "Ciclo Março/2026",
      referenceLabel: "Mar/2026",
      startDate: new Date("2026-02-21T00:00:00.000Z"),
      endDate: new Date("2026-03-20T23:59:59.999Z")
    },
    {
      name: "Ciclo Abril/2026",
      referenceLabel: "Abr/2026",
      startDate: new Date("2026-03-21T00:00:00.000Z"),
      endDate: new Date("2026-04-20T23:59:59.999Z")
    }
  ];

  for (const cycle of cycles) {
    await prisma.financialCycle.upsert({
      where: {
        id: `${cycle.referenceLabel}`
      },
      update: {},
      create: {
        id: `${cycle.referenceLabel}`,
        userId: user.id,
        ...cycle
      }
    });
  }

  const categories = [
    { name: "Moradia", type: CategoryType.EXPENSE, color: "#7dd3fc", budgetCeiling: "2500" },
    { name: "Lazer", type: CategoryType.EXPENSE, color: "#fb7185", budgetCeiling: "800" },
    { name: "Salário", type: CategoryType.INCOME, color: "#86efac", budgetCeiling: null },
    { name: "ETF", type: CategoryType.INVESTMENT, color: "#fbbf24", budgetCeiling: null }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: user.id,
          name: category.name,
          type: category.type
        }
      },
      update: {},
      create: {
        userId: user.id,
        ...category
      }
    });
  }

  const salaryCategory = await prisma.category.findFirstOrThrow({
    where: {
      userId: user.id,
      name: "Salário"
    }
  });

  const housingCategory = await prisma.category.findFirstOrThrow({
    where: {
      userId: user.id,
      name: "Moradia"
    }
  });

  const investmentCategory = await prisma.category.findFirstOrThrow({
    where: {
      userId: user.id,
      name: "ETF"
    }
  });

  const currentCycle = await prisma.financialCycle.findFirstOrThrow({
    where: { userId: user.id },
    orderBy: { startDate: "asc" }
  });

  await prisma.income.upsert({
    where: { id: "seed-income-salary" },
    update: {},
    create: {
      id: "seed-income-salary",
      userId: user.id,
      financialCycleId: currentCycle.id,
      categoryId: salaryCategory.id,
      sourceName: "Empresa",
      amount: 8500,
      receivedAt: new Date("2026-03-05T12:00:00.000Z"),
      notes: "Receita principal do mês"
    }
  });

  await prisma.expense.upsert({
    where: { id: "seed-expense-rent" },
    update: {},
    create: {
      id: "seed-expense-rent",
      userId: user.id,
      financialCycleId: currentCycle.id,
      categoryId: housingCategory.id,
      title: "Aluguel",
      amount: 2200,
      purchaseDate: new Date("2026-03-08T12:00:00.000Z"),
      paymentMethod: PaymentMethod.PIX,
      installmentsCount: 1
    }
  });

  const investment = await prisma.investment.upsert({
    where: { id: "seed-investment-broad-etf" },
    update: {},
    create: {
      id: "seed-investment-broad-etf",
      userId: user.id,
      categoryId: investmentCategory.id,
      name: "ETF Global",
      assetType: InvestmentType.STOCKS_ETFS,
      amountInvested: 3000,
      currentValue: 3180,
      investedAt: new Date("2026-03-10T12:00:00.000Z")
    }
  });

  await prisma.investmentSnapshot.upsert({
    where: { id: "seed-snapshot-1" },
    update: {},
    create: {
      id: "seed-snapshot-1",
      investmentId: investment.id,
      value: 3180,
      capturedAt: new Date("2026-03-20T12:00:00.000Z")
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
