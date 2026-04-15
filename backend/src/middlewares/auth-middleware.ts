import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/prisma.js";
import { verifyAuthToken } from "../services/auth-service.js";

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      response.status(StatusCodes.UNAUTHORIZED).json({
        message: "Authentication required"
      });
      return;
    }

    const token = authorizationHeader.replace("Bearer ", "").trim();
    const tokenPayload = verifyAuthToken(token);

    if (!tokenPayload) {
      response.status(StatusCodes.UNAUTHORIZED).json({
        message: "Invalid or expired token"
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId }
    });

    if (!user || !user.passwordHash) {
      response.status(StatusCodes.UNAUTHORIZED).json({
        message: "User session is no longer valid"
      });
      return;
    }

    request.authUserId = user.id;
    next();
  } catch (error) {
    next(error);
  }
}
