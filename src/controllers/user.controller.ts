import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { getAuthenticatedUserId, handleControllerError, isRecord } from '../utils/http';
import { toPublicUser } from '../utils/user';
import { parsePassword, parseRequiredString } from '../utils/validation';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const user = await userService.getCurrentUserProfile(userId);

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const nextNameValue = req.body.displayName ?? req.body.name;
    const name = parseRequiredString(nextNameValue, 'name', { minLength: 2, maxLength: 100 });
    const user = await userService.updateCurrentUserProfile(userId, name);

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const currentPassword = parsePassword(req.body.currentPassword, 'currentPassword');
    const newPassword = parsePassword(req.body.newPassword, 'newPassword');

    await userService.updateCurrentUserPassword(userId, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const deleteMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    await userService.deleteCurrentUser(userId);

    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
};
