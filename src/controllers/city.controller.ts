import { Request, Response } from 'express';

import * as cityService from '../services/city.service';
import { handleControllerError } from '../utils/http';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** GET /cities/search — Busca ciudades por nombre. */
export const searchCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const cities = await cityService.searchCities(query);

    res.json({ cities });
  } catch (error) {
    handleControllerError(res, error);
  }
};
