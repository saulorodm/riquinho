import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { getSettings, updateSettings } from "../services/settings-service.js";
import { ensureCyclesWindow } from "../services/cycle-service.js";
import { getCurrentUser } from "../services/user-service.js";
import { settingsPayloadSchema } from "../validators/settings-validator.js";

export async function readSettings(_request: Request, response: Response) {
  const settings = await getSettings();
  response.json(settings);
}

export async function saveSettings(request: Request, response: Response) {
  const payload = settingsPayloadSchema.parse(request.body);
  const settings = await updateSettings(payload);
  const user = await getCurrentUser();

  await ensureCyclesWindow(user, 12, 12);

  response.status(StatusCodes.OK).json(settings);
}
