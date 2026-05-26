import { Request, Response } from 'express';

import * as searchHistoryService from '../services/search-history.service';
import { getAuthenticatedUserId, handleControllerError, isRecord } from '../utils/http';
import { parseNumber, parseOptionalString, parseRequiredString } from '../utils/validation';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** GET /search-history — Obtiene el historial de búsqueda del usuario. */
export const getSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    const history = await searchHistoryService.listSearchHistory(userId);

    res.json({ history });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/** POST /search-history — Agrega una entrada al historial de búsqueda. */
export const createSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isRecord(req.body)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const userId = getAuthenticatedUserId(req);
    const name = parseRequiredString(req.body.name, 'name', { minLength: 1, maxLength: 120 });
    const country = parseOptionalString(req.body.country, 'country', { maxLength: 120 });
    const lat = req.body.lat === undefined ? undefined : parseNumber(req.body.lat, 'lat');
    const lon = req.body.lon === undefined ? undefined : parseNumber(req.body.lon, 'lon');

    const entry = await searchHistoryService.addSearchHistoryEntry(userId, {
      name,
      country,
      lat,
      lon,
    });

    res.status(201).json({ entry });
  } catch (error) {
    handleControllerError(res, error);
  }
};

/** DELETE /search-history — Limpia todo el historial de búsqueda del usuario. */
export const clearSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);
    await searchHistoryService.clearSearchHistory(userId);

    res.status(204).send();
  } catch (error) {
    handleControllerError(res, error);
  }
};
