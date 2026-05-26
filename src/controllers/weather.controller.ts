import { Request, Response } from 'express';

import * as weatherService from '../services/weather.service';
import { handleControllerError } from '../utils/http';
import { parseNumber } from '../utils/validation';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** GET /weather/current — Obtiene el clima actual para una coordenada. */
export const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseNumber(req.query.lat, 'lat');
    const lon = parseNumber(req.query.lon, 'lon');
    const weather = await weatherService.getCurrentWeather(lat, lon);

    res.json(weather);
  } catch (error) {
    handleControllerError(res, error);
  }
};

/** GET /weather/forecast — Obtiene el pronóstico de 7 días para una coordenada. */
export const getForecastWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseNumber(req.query.lat, 'lat');
    const lon = parseNumber(req.query.lon, 'lon');
    const forecast = await weatherService.getForecastWeather(lat, lon);

    res.json(forecast);
  } catch (error) {
    handleControllerError(res, error);
  }
};
