import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as favoriteController from '../controllers/favorite.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.createFavorite);
router.delete('/:cityId', favoriteController.deleteFavorite);
router.patch('/reorder', favoriteController.reorderFavorites);

export default router;
