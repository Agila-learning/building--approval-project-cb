import { Router } from 'express';
import { templateController } from '../controllers/TemplateController';

const router = Router();

router.get('/', templateController.getTemplates);

export default router;
