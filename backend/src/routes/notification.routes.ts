import { Router } from 'express';
import * as notificationController from '../controllers/NotificationController';

const router = Router();

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear', notificationController.clearNotifications);
router.delete('/:id', notificationController.deleteNotification);
router.post('/lead-thanks', notificationController.sendLeadThanks);
router.post('/upload-link', notificationController.sendUploadLink);

export default router;
