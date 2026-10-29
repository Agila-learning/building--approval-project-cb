import { Request, Response } from 'express';
import { BrevoNotificationService } from '../services/BrevoNotificationService';
import prisma from '../prisma';

const notificationService = new BrevoNotificationService();

export const sendLeadThanks = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    await notificationService.notifyLeadThanks(email, name);
    res.status(200).json({ message: 'Thank you email sent' });
  } catch (error) {
    console.error('Error sending lead thanks:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

export const sendUploadLink = async (req: Request, res: Response) => {
  try {
    const { email, name, uploadLink } = req.body;
    if (!email || !name || !uploadLink) {
      return res.status(400).json({ error: 'Email, name, and uploadLink are required' });
    }

    await notificationService.notifyUploadLink(email, name, uploadLink);
    res.status(200).json({ message: 'Upload link email sent' });
  } catch (error) {
    console.error('Error sending upload link:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 30,
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

