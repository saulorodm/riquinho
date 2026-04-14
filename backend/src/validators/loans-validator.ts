import { z } from "zod";

export const loanPayloadSchema = z.object({
  borrowerName: z.string().min(2).max(120),
  principalAmount: z.coerce.number().positive(),
  dueDay: z.coerce.number().int().min(1).max(31),
  startDate: z.string().datetime(),
  installmentsCount: z.coerce.number().int().min(1).max(360),
  notes: z.string().max(500).optional()
});

export const loanInstallmentStatusSchema = z.object({
  isPaid: z.boolean()
});
