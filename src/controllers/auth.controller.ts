import { Request, Response } from 'express';

import * as authService from '../services/auth.service';
import { getAuthenticatedUserId, handleControllerError } from '../utils/http';
import { toPublicUser } from '../utils/user';
import { parseRequiredString, parsePassword } from '../utils/validation';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** POST /auth/register — Registra un nuevo usuario. */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = parseRequiredString(req.body.name, 'name', { minLength: 2, maxLength: 100 });
    const email = parseRequiredString(req.body.email, 'email', { minLength: 5, maxLength: 255 });
    const password = parsePassword(req.body.password, 'password');

    const user = await authService.register({ name, email, password });
    res.status(201).json({ user });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/** POST /auth/login — Autentica un usuario y retorna un JWT. */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = parseRequiredString(req.body.email, 'email');
    const password = parseRequiredString(req.body.password, 'password');

    const { token, user } = await authService.login({ email, password });
    res.json({ token, user });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/** GET /auth/me — Retorna los datos del usuario autenticado. */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const user = await authService.getCurrentUser(userId);

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/** POST /auth/logout — Logout (manejado del lado del cliente). */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    message: 'Logout handled client-side by removing the bearer token',
  });
};
