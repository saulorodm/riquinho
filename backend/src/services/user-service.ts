import { prisma } from "../config/prisma.js";

export async function getCurrentUser() {
  const existingUser = await prisma.user.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      name: "Usuário Principal",
      email: "owner@riquinho.local",
      cycleStartDay: 21,
      cycleEndDay: 20
    }
  });
}
