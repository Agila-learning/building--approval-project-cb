import { Router } from 'express';
import authRoutes from './auth.routes';
import propertyRoutes from './property.routes';
import caseRoutes from './case.routes';
import documentRoutes from './document.routes';
import notificationRoutes from './notification.routes';
import templateRoutes from './template.routes';
import feeRoutes from './fee.routes';
import dashboardRoutes from './dashboard.routes';
import leadRoutes from './lead.routes';
import userRoutes from './user.routes';
import { authController } from '../controllers/AuthController';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authController.getMe);
router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/cases', caseRoutes);
router.use('/documents', documentRoutes);
router.use('/checklist-templates', templateRoutes);
router.use('/fees', feeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/leads', leadRoutes);
router.use('/users', userRoutes);

export default router;
