import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma.js";
import { createAuthToken, hashPassword, verifyPassword } from "../services/auth-service.js";
import { serializePrisma } from "../utils/serialize.js";

const authCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120)
});

const bootstrapSchema = authCredentialsSchema.extend({
  name: z.string().min(2).max(80)
});

function serializeAuthUser(user: { id: string; name: string; email: string; createdAt: Date; updatedAt: Date }) {
  return serializePrisma({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
}

export async function getAuthStatus(_request: Request, response: Response) {
  const usersCount = await prisma.user.count();
  const hasConfiguredUser = await prisma.user.count({
    where: {
      passwordHash: {
        not: null
      }
    }
  });

  response.json({
    hasUser: usersCount > 0,
    hasConfiguredUser: hasConfiguredUser > 0,
    needsBootstrap: hasConfiguredUser === 0
  });
}

export async function bootstrapAuth(request: Request, response: Response) {
  const payload = bootstrapSchema.parse(request.body);
  const configuredUsers = await prisma.user.count({
    where: {
      passwordHash: {
        not: null
      }
    }
  });

  if (configuredUsers > 0) {
    response.status(StatusCodes.CONFLICT).json({
      message: "Authentication has already been configured. Please sign in."
    });
    return;
  }

  const conflictingEmail = await prisma.user.findFirst({
    where: {
      email: payload.email
    }
  });

  const bootstrapUser =
    conflictingEmail ??
    (await prisma.user.findFirst({
      orderBy: {
        createdAt: "asc"
      }
    }));

  const user = bootstrapUser
    ? await prisma.user.update({
        where: { id: bootstrapUser.id },
        data: {
          name: payload.name,
          email: payload.email,
          passwordHash: hashPassword(payload.password)
        }
      })
    : await prisma.user.create({
        data: {
          name: payload.name,
          email: payload.email,
          passwordHash: hashPassword(payload.password),
          cycleStartDay: 21,
          cycleEndDay: 20
        }
      });

  response.status(StatusCodes.CREATED).json({
    token: createAuthToken(user.id),
    user: serializeAuthUser(user)
  });
}

export async function loginAuth(request: Request, response: Response) {
  const payload = authCredentialsSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email: payload.email }
  });

  if (!user?.passwordHash || !verifyPassword(payload.password, user.passwordHash)) {
    response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid credentials"
    });
    return;
  }

  response.json({
    token: createAuthToken(user.id),
    user: serializeAuthUser(user)
  });
}

export async function readAuthMe(request: Request, response: Response) {
  const userId = request.authUserId!;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId }
  });

  response.json({
    user: serializeAuthUser(user)
  });
}
