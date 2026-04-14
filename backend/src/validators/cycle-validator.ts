import { z } from "zod";

export const financialCyclePayloadSchema = z
  .object({
    name: z.string().min(2).max(120),
    referenceLabel: z.string().max(20).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
  .refine(
    (value) => new Date(value.startDate).getTime() < new Date(value.endDate).getTime(),
    {
      message: "Start date must be before end date",
      path: ["endDate"]
    }
  );
