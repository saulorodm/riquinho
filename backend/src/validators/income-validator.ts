import { z } from "zod";

const entityIdSchema = z.string().min(1);

export const incomePayloadSchema = z.object({
  sourceName: z.string().min(2).max(120),
  amount: z.coerce.number().positive(),
  receivedAt: z.string().datetime(),
  categoryId: entityIdSchema.optional(),
  financialCycleId: entityIdSchema.optional(),
  notes: z.string().max(500).optional()
});
