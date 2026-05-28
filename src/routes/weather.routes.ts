import { Router } from 'express';
import * as weatherController from '../controllers/weather.controller';

const router = Router();

router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecastWeather);
router.get('/air-quality', weatherController.getAirQuality);

export default router;
