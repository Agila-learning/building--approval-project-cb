import { Router } from 'express';
import { documentController } from '../controllers/DocumentController';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', documentController.listDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.post('/verify-status', documentController.updateDocumentStatus);
router.post('/verify', documentController.updateDocumentStatus);
router.post('/', documentController.getSignedUrl);
router.patch('/:id/verify', documentController.verifyDocument);

export default router;
