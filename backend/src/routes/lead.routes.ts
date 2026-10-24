import { Router } from 'express';
import * as leadController from '../controllers/LeadController';

const router = Router();

router.post('/', leadController.createLead);
router.get('/', leadController.getLeads);
router.put('/:id/status', leadController.updateLeadStatus);
router.put('/:id/assign', leadController.updateLeadStatus);
router.put('/:id', leadController.updateLeadStatus);

export default router;
