import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as searchHistoryController from '../controllers/search-history.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', searchHistoryController.getSearchHistory);
router.post('/', searchHistoryController.createSearchHistory);
router.delete('/', searchHistoryController.clearSearchHistory);

export default router;
