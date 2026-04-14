import { prisma } from "../config/prisma.js";
import { serializePrisma } from "../utils/serialize.js";
import { getCurrentUser } from "./user-service.js";

export async function getSettings() {
  const user = await getCurrentUser();

  return serializePrisma({
    cycleStartDay: user.cycleStartDay,
    cycleEndDay: user.cycleEndDay,
    updatedAt: user.updatedAt
  });
}

export async function updateSettings(payload: { cycleStartDay: number; cycleEndDay: number }) {
  const user = await getCurrentUser();

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      cycleStartDay: payload.cycleStartDay,
      cycleEndDay: payload.cycleEndDay
    }
  });

  return serializePrisma({
    cycleStartDay: updatedUser.cycleStartDay,
    cycleEndDay: updatedUser.cycleEndDay,
    updatedAt: updatedUser.updatedAt
  });
}
