import type { NextFunction, Request, Response } from 'express';
import createHttpError, { isHttpError } from 'http-errors';

export function normalizarErrorJson(
  error: unknown,
  _solicitud: Request,
  _respuesta: Response,
  siguiente: NextFunction,
): void {
  // Nest transforma SyntaxError en BadRequestException usando el mensaje original.
  // Conservar el estado HTTP con un Error normal permite que el filtro lo sanitice.
  if (error instanceof SyntaxError && isHttpError(error)) {
    siguiente(createHttpError(error.statusCode));
    return;
  }
  siguiente(error);
}
