import { Router } from 'express';
import { feeController } from '../controllers/FeeController';

const router = Router();

router.post('/:caseId', feeController.addFee);
router.patch('/:id/mark-paid', feeController.markPaid);

export default router;
