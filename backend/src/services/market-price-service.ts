import { InvestmentType, type Investment, type Prisma } from "@prisma/client";

import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

function isAutoPricedAsset(assetType: InvestmentType) {
  return assetType !== InvestmentType.FIXED_INCOME && assetType !== InvestmentType.CASH_RESERVE;
}

function normalizeTicker(name: string) {
  return name.trim().toUpperCase();
}

async function fetchBrapiPrice(ticker: string) {
  const url = new URL(`https://brapi.dev/api/quote/${ticker}`);

  if (env.BRAPI_TOKEN) {
    url.searchParams.set("token", env.BRAPI_TOKEN);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    results?: Array<{
      regularMarketPrice?: number;
    }>;
  };

  return payload.results?.[0]?.regularMarketPrice ?? null;
}

async function fetchCoinGeckoPrice(symbolOrId: string) {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", symbolOrId.toLowerCase());
  url.searchParams.set("vs_currencies", "brl");
  url.searchParams.set("include_last_updated_at", "true");

  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as Record<string, { brl?: number }>;
  return payload[symbolOrId.toLowerCase()]?.brl ?? null;
}

async function fetchMarketUnitPrice(investment: Investment) {
  if (investment.assetType === InvestmentType.CRYPTO) {
    return fetchCoinGeckoPrice(investment.name);
  }

  if (
    investment.assetType === InvestmentType.STOCKS_ETFS ||
    investment.assetType === InvestmentType.REITS_FIIS ||
    investment.assetType === InvestmentType.OTHER
  ) {
    return fetchBrapiPrice(normalizeTicker(investment.name));
  }

  return null;
}

export async function syncInvestmentMarketPrice(
  investment: Investment,
  transactionClient?: Prisma.TransactionClient
) {
  if (!isAutoPricedAsset(investment.assetType) || !investment.currentQuantity) {
    return investment;
  }

  const marketUnitPrice = await fetchMarketUnitPrice(investment);

  if (!marketUnitPrice) {
    return investment;
  }

  const nextCurrentValue = Number((Number(investment.currentQuantity) * marketUnitPrice).toFixed(2));
  const db = transactionClient ?? prisma;

  await db.investment.update({
    where: { id: investment.id },
    data: {
      currentValue: nextCurrentValue,
      netCurrentValue: nextCurrentValue
    }
  });

  await db.investmentSnapshot.create({
    data: {
      investmentId: investment.id,
      value: nextCurrentValue,
      capturedAt: new Date()
    }
  });

  return db.investment.findUniqueOrThrow({
    where: { id: investment.id }
  });
}

export async function syncUserInvestmentQuotes(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { userId }
  });

  for (const investment of investments) {
    await syncInvestmentMarketPrice(investment);
  }
}
