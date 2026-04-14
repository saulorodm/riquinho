import { Prisma } from "@prisma/client";

export function serializePrisma<T>(value: T): T {
  if (value instanceof Prisma.Decimal) {
    return Number(value) as T;
  }

  if (value instanceof Date) {
    return value.toISOString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrisma(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce<Record<string, unknown>>((accumulator, [key, item]) => {
      accumulator[key] = serializePrisma(item);
      return accumulator;
    }, {}) as T;
  }

  return value;
}
