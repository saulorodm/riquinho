import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { getSettings, updateSettings } from "../services/settings-service.js";
import { ensureCyclesWindow } from "../services/cycle-service.js";
import { getCurrentUser } from "../services/user-service.js";
import { settingsPayloadSchema } from "../validators/settings-validator.js";

export async function readSettings(request: Request, response: Response) {
  const settings = await getSettings(request);
  response.json(settings);
}

export async function saveSettings(request: Request, response: Response) {
  const payload = settingsPayloadSchema.parse(request.body);
  const settings = await updateSettings(request, payload);
  const user = await getCurrentUser(request);

  await ensureCyclesWindow(user, 12, 12);

  response.status(StatusCodes.OK).json(settings);
}
