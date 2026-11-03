import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';

const router = Router();

router.get('/', paymentController.listPayments);
router.post('/verify', paymentController.recordAndVerifyPayment);
router.post('/send-request', paymentController.sendPaymentRequest);

export default router;
