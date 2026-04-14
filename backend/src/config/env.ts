import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  BRAPI_TOKEN: z.string().optional(),
  COINGECKO_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);
