import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
    let callerRole = (req.headers['x-user-role'] || req.query.role || '') as string;
    let callerPhone = (req.headers['x-user-phone'] || req.query.phone || '') as string;
    let callerId = (req.headers['x-user-id'] || req.query.userId || '') as string;

    // Decode JWT from Authorization Bearer token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
        if (decoded) {
          if (!callerRole) callerRole = decoded.role;
          if (!callerPhone) callerPhone = decoded.phone;
          if (!callerId) callerId = decoded.id;
        }
      } catch (_) {}
    }

    // STRICT CUSTOMER RESTRICTION: Customers only receive notifications for their own applications
    if (callerRole.toUpperCase() === 'CLIENT_READONLY') {
      const cleanPhone = String(callerPhone || '').replace(/\D/g, '').slice(-10);
      const allowedIdentifiers = new Set<string>();

      if (cleanPhone.length === 10) {
        const allCases = await prisma.case.findMany({
          select: { id: true, application_number: true, property: true, fullData: true }
        });

        const customerCases = allCases.filter((c: any) => {
          const propPhone = String(c.property?.owner_phone || '').replace(/\D/g, '').slice(-10);
          const fullMobile = String(c.fullData?.mobile || c.fullData?.phone || c.fullData?.owner_phone || '').replace(/\D/g, '').slice(-10);
          const caseMobile = String((c as any).mobile || '').replace(/\D/g, '').slice(-10);
          return propPhone === cleanPhone || fullMobile === cleanPhone || caseMobile === cleanPhone;
        });

        customerCases.forEach((c: any) => {
          if (c.id) allowedIdentifiers.add(c.id);
          if (c.application_number) {
            allowedIdentifiers.add(c.application_number);
            allowedIdentifiers.add(c.application_number.replace(/^APP-/, ''));
            allowedIdentifiers.add(`APP-${c.application_number.replace(/^APP-/, '')}`);
          }
        });
      }

      if (req.query.caseId) {
        allowedIdentifiers.add(String(req.query.caseId));
      }

      if (allowedIdentifiers.size === 0) {
        return res.status(200).json([]);
      }

      const idList = Array.from(allowedIdentifiers);

      // Fetch ONLY notifications tied to customer's applications, strictly excluding admin/staff internal alerts
      const customerNotifications = await prisma.notification.findMany({
        where: {
          case_id: { in: idList },
          type: { notIn: ['attendance', 'lead_created', 'lead_assigned', 'enquiry_created', 'staff_login'] }
        },
        orderBy: { created_at: 'desc' },
        take: 30,
      });

      return res.status(200).json(customerNotifications);
    }

    // Default for Admin and Staff
    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 40,
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
    let callerRole = (req.headers['x-user-role'] || req.query.role || '') as string;
    let callerPhone = (req.headers['x-user-phone'] || req.query.phone || '') as string;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
        if (decoded) {
          if (!callerRole) callerRole = decoded.role;
          if (!callerPhone) callerPhone = decoded.phone;
        }
      } catch (_) {}
    }

    if (callerRole.toUpperCase() === 'CLIENT_READONLY') {
      const cleanPhone = String(callerPhone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        const allCases = await prisma.case.findMany({
          select: { id: true, application_number: true, property: true, fullData: true }
        });
        const matched = allCases.filter((c: any) => {
          const p = String(c.property?.owner_phone || '').replace(/\D/g, '').slice(-10);
          const f = String(c.fullData?.mobile || c.fullData?.phone || '').replace(/\D/g, '').slice(-10);
          return p === cleanPhone || f === cleanPhone;
        });
        const ids = matched.flatMap((c: any) => [c.id, c.application_number, `APP-${c.application_number}`].filter(Boolean));
        await prisma.notification.updateMany({
          where: { case_id: { in: ids }, read: false },
          data: { read: true },
        });
        return res.status(200).json({ success: true });
      }
    }

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

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.delete({ where: { id } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

export const clearNotifications = async (req: Request, res: Response) => {
  try {
    let callerRole = (req.headers['x-user-role'] || req.query.role || '') as string;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
        if (decoded?.role) callerRole = decoded.role;
      } catch (_) {}
    }

    // Disallow regular customers from wiping entire database notifications table
    if (callerRole.toUpperCase() === 'CLIENT_READONLY') {
      return res.status(200).json({ success: true });
    }

    await prisma.notification.deleteMany({});
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
};


