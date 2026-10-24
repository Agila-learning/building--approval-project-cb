import { Router } from 'express';
import { propertyController } from '../controllers/PropertyController';

const router = Router();

router.post('/', propertyController.createProperty);
router.get('/:id', propertyController.getProperty);
router.get('/', propertyController.listProperties);

export default router;
