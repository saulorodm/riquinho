import { z } from "zod";

export const settingsPayloadSchema = z.object({
  cycleStartDay: z.coerce.number().int().min(1).max(31),
  cycleEndDay: z.coerce.number().int().min(1).max(31)
});
