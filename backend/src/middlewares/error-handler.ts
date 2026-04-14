import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return response.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      issues: error.flatten()
    });
  }

  if (error instanceof Error) {
    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message
    });
  }

  return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Unexpected server error"
  });
}
