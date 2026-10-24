import { Request, Response } from 'express';
import { BrevoNotificationService } from '../services/BrevoNotificationService';

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
