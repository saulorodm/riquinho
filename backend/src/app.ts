import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

const allowedOrigins = new Set(
  [env.FRONTEND_URL, env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
  })
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", apiRouter);
app.use(errorHandler);
