import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../prisma';
import { BrevoNotificationService } from '../services/BrevoNotificationService';
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
import paymentRoutes from './payment.routes';
import settingsRoutes from './settings.routes';
import { authController } from '../controllers/AuthController';

const router = Router();

router.get('/health', async (req, res) => {
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: { status: 'checking' },
      cloudinary: { status: 'checking' },
      brevo: { status: 'checking' },
    }
  };

  try {
    await prisma.user.count();
    healthStatus.services.mongodb = { status: 'connected', cluster: 'cluster0.pihka8o.mongodb.net' };
  } catch (e: any) {
    healthStatus.services.mongodb = { status: 'error', message: e.message };
    healthStatus.status = 'degraded';
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const cloudRes = await cloudinary.api.ping();
    healthStatus.services.cloudinary = {
      status: cloudRes.status === 'ok' ? 'connected' : 'error',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'not configured'
    };
  } catch (err: any) {
    healthStatus.services.cloudinary = { status: 'error', message: err.message };
    healthStatus.status = 'degraded';
  }

  try {
    const brevoService = new BrevoNotificationService();
    const brevoRes = await brevoService.verifyConnection();
    healthStatus.services.brevo = {
      status: brevoRes.success ? 'connected' : 'error',
      sender: process.env.BREVO_SENDER_EMAIL,
      details: brevoRes.message
    };
    if (!brevoRes.success) healthStatus.status = 'degraded';
  } catch (err: any) {
    healthStatus.services.brevo = { status: 'error', message: err.message };
    healthStatus.status = 'degraded';
  }

  res.json(healthStatus);
});

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
router.use('/payments', paymentRoutes);
router.use('/settings', settingsRoutes);

export default router;
