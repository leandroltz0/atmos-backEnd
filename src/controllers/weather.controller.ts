import { Request, Response } from 'express';
import * as weatherService from '../services/weather.service';
import { handleControllerError } from '../utils/http';
import { parseNumber } from '../utils/validation';

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
