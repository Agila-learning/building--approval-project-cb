import { Router } from 'express';
import * as notificationController from '../controllers/NotificationController';

const router = Router();

router.post('/lead-thanks', notificationController.sendLeadThanks);
router.post('/upload-link', notificationController.sendUploadLink);

export default router;
