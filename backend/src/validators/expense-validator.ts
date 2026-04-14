import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

const entityIdSchema = z.string().min(1);

export const expensePayloadSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(255).optional(),
  amount: z.coerce.number().positive(),
  expenseKind: z.enum(["OPERATIONAL", "EXTRAORDINARY", "PATRIMONIAL"]).default("OPERATIONAL"),
  isRecurring: z.coerce.boolean().default(false),
  categoryId: entityIdSchema.optional(),
  purchaseDate: z.string().datetime(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().max(500).optional(),
  installmentsCount: z.coerce.number().int().min(1).max(24).default(1),
  financialCycleId: entityIdSchema.optional()
});
