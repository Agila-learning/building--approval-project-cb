import { Router } from 'express';
import { authController } from '../controllers/AuthController';

const router = Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.forgotPassword);
router.get('/me', authController.getMe);

export default router;
