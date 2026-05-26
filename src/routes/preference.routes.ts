import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as preferenceController from '../controllers/preference.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', preferenceController.getPreferences);
router.patch('/', preferenceController.updatePreferences);

export default router;
