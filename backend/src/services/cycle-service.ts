import type { User } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import { getCurrentUser } from "./user-service.js";

function getUtcDate(year: number, month: number, day: number, endOfDay = false) {
  const safeDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const normalizedDay = Math.min(day, safeDay);

  return endOfDay
    ? new Date(Date.UTC(year, month, normalizedDay, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month, normalizedDay, 0, 0, 0, 0));
}

function addUtcMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function formatReferenceLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  })
    .format(date)
    .replace(".", "")
    .replace(" de ", "/")
    .replace(" ", "/")
    .replace(/^./, (char) => char.toUpperCase());
}

function buildConfiguredCycleRange(user: User, referenceDate: Date) {
  if (!user.cycleStartDay || !user.cycleEndDay) {
    return null;
  }

  const referenceYear = referenceDate.getUTCFullYear();
  const referenceMonth = referenceDate.getUTCMonth();
  const currentMonthStart = getUtcDate(referenceYear, referenceMonth, user.cycleStartDay);
  const startDate =
    referenceDate >= currentMonthStart
      ? currentMonthStart
      : getUtcDate(referenceYear, referenceMonth - 1, user.cycleStartDay);
  const endBase = addUtcMonths(startDate, 1);
  const endDate = getUtcDate(
    endBase.getUTCFullYear(),
    endBase.getUTCMonth(),
    user.cycleEndDay,
    true
  );
  const referenceLabel = formatReferenceLabel(startDate);

  return {
    name: `Ciclo ${referenceLabel}`,
    referenceLabel,
    startDate,
    endDate
  };
}

async function ensureCycleForRange(
  user: User,
  range: { name: string; referenceLabel: string; startDate: Date; endDate: Date }
) {
  return prisma.financialCycle.upsert({
    where: {
      userId_startDate_endDate: {
        userId: user.id,
        startDate: range.startDate,
        endDate: range.endDate
      }
    },
    update: {
      name: range.name,
      referenceLabel: range.referenceLabel
    },
    create: {
      userId: user.id,
      name: range.name,
      referenceLabel: range.referenceLabel,
      startDate: range.startDate,
      endDate: range.endDate
    }
  });
}

export async function findCycleForDate(userId: string, date: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (user?.cycleStartDay && user.cycleEndDay) {
    const range = buildConfiguredCycleRange(user, date);

    if (range) {
      return ensureCycleForRange(user, range);
    }
  }

  return prisma.financialCycle.findFirst({
    where: {
      userId,
      startDate: {
        lte: date
      },
      endDate: {
        gte: date
      }
    }
  });
}

export async function getCurrentCycle(userId: string) {
  const now = new Date();

  const currentCycle = await findCycleForDate(userId, now);

  if (currentCycle) {
    return currentCycle;
  }

  return prisma.financialCycle.findFirst({
    where: { userId },
    orderBy: { endDate: "desc" }
  });
}

export async function ensureCyclesWindow(user: User, monthsBack: number, monthsForward: number) {
  if (!user.cycleStartDay || !user.cycleEndDay) {
    return prisma.financialCycle.findMany({
      where: {
        userId: user.id,
        endDate: {
          gte: user.createdAt
        }
      },
      orderBy: { startDate: "desc" }
    });
  }

  const cycles = [];
  const entryAnchorDate = new Date(user.createdAt);
  const currentAnchorDate = new Date();
  const monthDistance =
    (currentAnchorDate.getUTCFullYear() - entryAnchorDate.getUTCFullYear()) * 12 +
    (currentAnchorDate.getUTCMonth() - entryAnchorDate.getUTCMonth());
  const startOffset = Math.max(-monthsBack, -monthDistance);

  for (let offset = startOffset; offset <= monthsForward; offset += 1) {
    const shiftedDate = new Date(
      Date.UTC(
        currentAnchorDate.getUTCFullYear(),
        currentAnchorDate.getUTCMonth() + offset,
        currentAnchorDate.getUTCDate()
      )
    );
    const range = buildConfiguredCycleRange(user, shiftedDate);

    if (!range || range.endDate < user.createdAt) {
      continue;
    }

    const cycle = await ensureCycleForRange(user, range);
    cycles.push(cycle);
  }

  return cycles.sort((first, second) => second.startDate.getTime() - first.startDate.getTime());
}

export async function getAvailableCycles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return [];
  }

  if (user.cycleStartDay && user.cycleEndDay) {
    return ensureCyclesWindow(user, 12, 0);
  }

  return prisma.financialCycle.findMany({
    where: {
      userId,
      endDate: {
        gte: user.createdAt
      }
    },
    orderBy: { startDate: "desc" }
  });
}

export async function getCurrentUserCycle() {
  const user = await getCurrentUser();
  return getCurrentCycle(user.id);
}
