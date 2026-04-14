import { AssetCategory } from "@prisma/client";
import { z } from "zod";

export const assetPayloadSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.nativeEnum(AssetCategory),
  currentValue: z.coerce.number().positive(),
  acquisitionValue: z.coerce.number().positive().optional(),
  acquiredAt: z.string().datetime(),
  notes: z.string().max(500).optional()
});
