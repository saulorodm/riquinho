import type { Request } from "express";

import { prisma } from "../config/prisma.js";

export async function getCurrentUser(request: Request) {
  if (!request.authUserId) {
    throw new Error("Authenticated user not found in request");
  }

  return prisma.user.findUniqueOrThrow({
    where: { id: request.authUserId }
  });
}
