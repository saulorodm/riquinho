import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import { assetPayloadSchema } from "../validators/assets-validator.js";

export async function listAssets(_request: Request, response: Response) {
  const user = await getCurrentUser();
  const assets = await prisma.asset.findMany({
    where: { userId: user.id },
    orderBy: { acquiredAt: "desc" }
  });

  response.json(serializePrisma(assets));
}

export async function createAsset(request: Request, response: Response) {
  const payload = assetPayloadSchema.parse(request.body);
  const user = await getCurrentUser();

  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      name: payload.name,
      category: payload.category,
      currentValue: payload.currentValue,
      acquisitionValue: payload.acquisitionValue,
      acquiredAt: new Date(payload.acquiredAt),
      notes: payload.notes
    }
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(asset));
}

export async function updateAsset(request: Request, response: Response) {
  const assetId = String(request.params.id);
  const payload = assetPayloadSchema.parse(request.body);
  const user = await getCurrentUser();
  const existingAsset = await prisma.asset.findFirstOrThrow({
    where: {
      id: assetId,
      userId: user.id
    }
  });

  const asset = await prisma.asset.update({
    where: { id: existingAsset.id },
    data: {
      name: payload.name,
      category: payload.category,
      currentValue: payload.currentValue,
      acquisitionValue: payload.acquisitionValue,
      acquiredAt: new Date(payload.acquiredAt),
      notes: payload.notes
    }
  });

  response.json(serializePrisma(asset));
}

export async function deleteAsset(request: Request, response: Response) {
  const assetId = String(request.params.id);
  const user = await getCurrentUser();

  await prisma.asset.deleteMany({
    where: {
      id: assetId,
      userId: user.id
    }
  });

  response.status(StatusCodes.NO_CONTENT).send();
}
