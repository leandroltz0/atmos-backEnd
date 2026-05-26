import { Request, Response } from 'express';
import * as favoriteService from '../services/favorite.service';
import { getAuthenticatedUserId, handleControllerError, isRecord } from '../utils/http';
import { parseNumber, parseRequiredString } from '../utils/validation';

export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const favorites = await favoriteService.listFavorites(userId);

    res.json({ favorites });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const createFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const name = parseRequiredString(req.body.name, 'name', { minLength: 1, maxLength: 120 });
    const country = parseRequiredString(req.body.country, 'country', { minLength: 1, maxLength: 120 });
    const lat = parseNumber(req.body.lat, 'lat');
    const lon = parseNumber(req.body.lon, 'lon');

    const favorite = await favoriteService.addFavorite(userId, {
      name,
      country,
      lat,
      lon,
    });

    res.status(201).json({ favorite });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const deleteFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const cityId = typeof req.params.cityId === 'string' ? req.params.cityId : '';
    await favoriteService.removeFavorite(userId, cityId);

    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const reorderFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const rawFavorites = req.body.favoriteIds;

    if (!Array.isArray(rawFavorites) || rawFavorites.some((item) => typeof item !== 'string' && typeof item !== 'number')) {
      res.status(400).json({ error: 'favoriteIds must be an array of ids' });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const favorites = await favoriteService.reorderFavorites(
      userId,
      rawFavorites.map((item) => String(item))
    );

    res.json({ favorites });
  } catch (error) {
    handleControllerError(res, error);
  }
};
