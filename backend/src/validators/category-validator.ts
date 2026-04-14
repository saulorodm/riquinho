import { CategoryType } from "@prisma/client";
import { z } from "zod";

export const categoryPayloadSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.nativeEnum(CategoryType),
  budgetCeiling: z.coerce.number().nonnegative().optional(),
  color: z.string().min(4).max(20).optional(),
  icon: z.string().min(2).max(40).optional()
});
