import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { assignedCases: true }
        }
      }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      staffId: u.staffId || u.id,
      name: u.name,
      mobile: u.phone,
      email: u.email || '',
      status: u.status,
      assigned: u._count.assignedCases,
      role: u.role
    }));
    res.json(formattedUsers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

import { BrevoNotificationService } from '../services/BrevoNotificationService';

const notificationService = new BrevoNotificationService();

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, password, status, role = 'STAFF' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Staff name is required.' });
    }

    // 1. Mobile Number Validation: Must be 10 digits starting with 6, 7, 8, or 9
    const cleanMobile = mobile ? String(mobile).trim().replace(/\D/g, '').slice(-10) : '';
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
    }

    // 2. Email Validation
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address containing @ and a valid domain.' });
    }

    const existing = await prisma.user.findUnique({ where: { phone: cleanMobile } });
    if (existing) {
      return res.status(400).json({ error: 'Mobile number already registered to another user.' });
    }

    const plainPassword = password || 'StaffPass@2026';
    const password_hash = await bcrypt.hash(plainPassword, 10);

    const count = await prisma.user.count({ where: { role: 'STAFF' } });
    const formattedCount = String(count + 1).padStart(3, '0');
    const staffId = `EMP-${formattedCount}`;

    const newUser = await prisma.user.create({
      data: {
        staffId,
        name: name.trim(),
        phone: cleanMobile,
        email: cleanEmail || null,
        password_hash,
        status: status || 'Active',
        role
      }
    });

    // 3. Create Real Notification in DB
    try {
      await prisma.notification.create({
        data: {
          title: 'New Staff Member Added',
          message: `${newUser.name} (${staffId}) was registered as ${role}.`,
          type: 'STAFF',
          read: false,
        }
      });
    } catch (notifErr) {
      console.error("Failed to create staff notification:", notifErr);
    }

    // 4. Send Real Login Credentials Email via Brevo
    if (cleanEmail) {
      const origin = req.headers.origin || 'http://localhost:5175';
      notificationService.notifyStaffCredentials({
        staffEmail: cleanEmail,
        staffName: newUser.name,
        staffId,
        phone: cleanMobile,
        password: plainPassword,
        role,
        loginUrl: `${origin}/login`
      }).catch(err => {
        console.error("Failed to send staff credentials email via Brevo:", err);
      });
    }

    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, mobile, email, password, status, role } = req.body;

    const dataToUpdate: any = {
      name,
      phone: mobile,
      email: email || null,
      status,
    };

    if (password) {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }
    if (role) {
      dataToUpdate.role = role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
