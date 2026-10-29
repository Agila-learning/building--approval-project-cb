import { Router } from 'express';
import * as notificationController from '../controllers/NotificationController';

const router = Router();

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.post('/lead-thanks', notificationController.sendLeadThanks);
router.post('/upload-link', notificationController.sendUploadLink);

export default router;
