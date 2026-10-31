import { Router } from 'express';
import { caseController } from '../controllers/CaseController';

const router = Router();

router.post('/', caseController.createCase);
router.get('/:id', caseController.getCase);
router.put('/:id', caseController.updateCase);
router.patch('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);
router.get('/', caseController.listCases);
router.post('/:id/stages/update', caseController.updateStage);
router.put('/:id/stages/update', caseController.updateStage);
router.put('/:id/stage', caseController.updateStage);
router.post('/:id/stage', caseController.updateStage);

export default router;
