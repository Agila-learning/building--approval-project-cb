import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';

const router = Router();

router.get('/', paymentController.getSettings);
router.post('/', paymentController.updateSettings);

export default router;
