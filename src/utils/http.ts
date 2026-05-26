import { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// Error personalizado
// ---------------------------------------------------------------------------

/** Error de aplicación con código de estado HTTP. */
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Helpers de request
// ---------------------------------------------------------------------------

/** Extrae el ID del usuario autenticado del request. Lanza 401 si no está autenticado. */
export const getAuthenticatedUserId = (req: Request): number => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Authentication required');
  }

  return req.user.userId;
};

/** Verifica que un valor sea un objeto plano (no array, no null). */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// ---------------------------------------------------------------------------
// Manejo de errores en controllers
// ---------------------------------------------------------------------------

/** Maneja errores en controllers: responde con el código HTTP apropiado. */
export const handleControllerError = (res: Response, error: unknown): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
};
