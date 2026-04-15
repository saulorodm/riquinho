import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { getCurrentUser } from "../services/user-service.js";
import { serializePrisma } from "../utils/serialize.js";
import { categoryPayloadSchema } from "../validators/category-validator.js";

export async function listCategories(request: Request, response: Response) {
  const user = await getCurrentUser(request);
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }]
  });

  response.json(serializePrisma(categories));
}

export async function createCategory(request: Request, response: Response) {
  const payload = categoryPayloadSchema.parse(request.body);
  const user = await getCurrentUser(request);

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      ...payload
    }
  });

  response.status(StatusCodes.CREATED).json(serializePrisma(category));
}

export async function updateCategory(request: Request, response: Response) {
  const categoryId = String(request.params.id);
  const payload = categoryPayloadSchema.parse(request.body);
  const user = await getCurrentUser(request);
  const existingCategory = await prisma.category.findFirstOrThrow({
    where: {
      id: categoryId,
      userId: user.id
    }
  });

  const category = await prisma.category.update({
    where: { id: existingCategory.id },
    data: payload
  });

  response.json(serializePrisma(category));
}

export async function deleteCategory(request: Request, response: Response) {
  const categoryId = String(request.params.id);
  const user = await getCurrentUser(request);

  await prisma.category.deleteMany({
    where: {
      id: categoryId,
      userId: user.id
    }
  });

  response.status(StatusCodes.NO_CONTENT).send();
}
