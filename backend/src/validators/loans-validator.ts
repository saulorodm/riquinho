import { z } from "zod";

export const loanPayloadSchema = z.object({
  borrowerName: z.string().min(2).max(120),
  principalAmount: z.coerce.number().positive(),
  dueDay: z.coerce.number().int().min(1).max(31),
  startDate: z.string().datetime(),
  firstInstallmentDate: z.string().datetime(),
  installmentsCount: z.coerce.number().int().min(1).max(360),
  notes: z.string().max(500).optional()
}).superRefine((value, context) => {
  const startDate = new Date(value.startDate).getTime();
  const firstInstallmentDate = new Date(value.firstInstallmentDate).getTime();

  if (firstInstallmentDate < startDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["firstInstallmentDate"],
      message: "A primeira parcela deve ser no mesmo dia ou depois da data do empréstimo."
    });
  }
});

export const loanInstallmentStatusSchema = z.object({
  isPaid: z.boolean()
});
