import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import { financialCyclePayloadSchema } from "../validators/cycle-validator.js";

export async function listCycles(request: Request, response: Response) {
  const user = await getCurrentUser(request);
  const cycles = await prisma.financialCycle.findMany({
    where: { userId: user.id },
    orderBy: { startDate: "desc" }
  });

  response.json(serializePrisma(cycles));
}

export async function createCycle(request: Request, response: Response) {
  const payload = financialCyclePayloadSchema.parse(request.body);
  const user = await getCurrentUser(request);

  const cycle = await prisma.financialCycle.create({
    data: {
      userId: user.id,
      name: payload.name,
      referenceLabel: payload.referenceLabel,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate)
    }
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(cycle));
}
