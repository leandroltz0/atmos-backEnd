import { Router } from 'express';
import * as cityController from '../controllers/city.controller';

const router = Router();

router.get('/search', cityController.searchCities);

export default router;
