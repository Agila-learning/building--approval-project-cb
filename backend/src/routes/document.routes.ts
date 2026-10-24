import { Router } from 'express';
import { documentController } from '../controllers/DocumentController';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.post('/', documentController.getSignedUrl); // the path in index will be nested or we can keep it as is.
router.patch('/:id/verify', documentController.verifyDocument);

export default router;
