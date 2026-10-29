import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './prisma';
import { v2 as cloudinary } from 'cloudinary';
import { BrevoNotificationService } from './services/BrevoNotificationService';

const PORT = process.env.PORT || 10000;

app.listen(PORT, async () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Building Approval Backend running on port ${PORT}`);
  console.log(`==================================================`);

  // 1. Verify MongoDB Atlas
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ [MongoDB Atlas] Connected successfully! (Active users in DB: ${userCount})`);
  } catch (err: any) {
    console.error(`❌ [MongoDB Atlas] Connection error:`, err.message);
  }

  // 2. Verify Cloudinary
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const cloudRes = await cloudinary.api.ping();
    if (cloudRes.status === 'ok') {
      console.log(`✅ [Cloudinary] Connected successfully! (Cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
    }
  } catch (err: any) {
    console.error(`❌ [Cloudinary] Connection error:`, err.message);
  }

  // 3. Verify Brevo
  try {
    const brevo = new BrevoNotificationService();
    const brevoRes = await brevo.verifyConnection();
    if (brevoRes.success) {
      console.log(`✅ [Brevo SMTP] Connected successfully! (Sender: ${process.env.BREVO_SENDER_EMAIL})`);
    } else {
      console.warn(`⚠️ [Brevo SMTP] Warning: ${brevoRes.message}`);
    }
  } catch (err: any) {
    console.error(`❌ [Brevo SMTP] Connection error:`, err.message);
  }
  console.log(`==================================================\n`);
});

