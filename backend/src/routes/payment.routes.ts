import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';

const router = Router();

router.get('/', paymentController.listPayments);
router.post('/verify', paymentController.recordAndVerifyPayment);

export default router;
