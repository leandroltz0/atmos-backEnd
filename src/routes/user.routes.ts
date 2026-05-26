import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware);
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.patch('/me/password', userController.updatePassword);
router.delete('/me', userController.deleteMe);

export default router;
