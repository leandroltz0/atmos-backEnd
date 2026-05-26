import { Request, Response } from 'express';
import * as preferenceService from '../services/preference.service';
import { getAuthenticatedUserId, handleControllerError, isRecord } from '../utils/http';
import {
  parseOptionalBoolean,
  parseOptionalInteger,
  parseOptionalString,
} from '../utils/validation';

export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const preferences = await preferenceService.getPreferences(userId);

    res.json({ preferences });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const preferences = await preferenceService.updatePreferences(userId, {
      tempUnit: parseOptionalString(req.body.tempUnit, 'tempUnit', { maxLength: 20 }),
      windUnit: parseOptionalString(req.body.windUnit, 'windUnit', { maxLength: 20 }),
      language: parseOptionalString(req.body.language, 'language', { maxLength: 20 }),
      timeFormat: parseOptionalString(req.body.timeFormat, 'timeFormat', { maxLength: 20 }),
      updateInterval: parseOptionalInteger(req.body.updateInterval, 'updateInterval', { min: 1, max: 1440 }),
      pushNotifications: parseOptionalBoolean(req.body.pushNotifications, 'pushNotifications'),
      autoUpdate: parseOptionalBoolean(req.body.autoUpdate, 'autoUpdate'),
      offlineMode: parseOptionalBoolean(req.body.offlineMode, 'offlineMode'),
    });

    res.json({ preferences });
  } catch (error) {
    handleControllerError(res, error);
  }
};
