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
      await (prisma as any).notification.create({
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
    const { name, mobile, phone, email, password, status, role } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    
    const rawMobile = mobile || phone;
    if (rawMobile) {
      dataToUpdate.phone = String(rawMobile).trim().replace(/\D/g, '').slice(-10);
    }
    
    if (email !== undefined) {
      const cleanEmail = email ? String(email).trim().toLowerCase() : '';
      dataToUpdate.email = cleanEmail || null;
    }
    
    if (status) dataToUpdate.status = status;
    if (role) dataToUpdate.role = role;

    if (password && String(password).trim().length > 0) {
      dataToUpdate.password_hash = await bcrypt.hash(String(password).trim(), 10);
    }

    let targetUser = null;
    if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      targetUser = await prisma.user.findUnique({ where: { id } });
    }
    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { staffId: id },
            ...(rawMobile ? [{ phone: String(rawMobile).trim().replace(/\D/g, '').slice(-10) }] : []),
            ...(email ? [{ email: String(email).trim().toLowerCase() }] : [])
          ]
        }
      });
    }

    if (targetUser) {
      const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: dataToUpdate
      });
      return res.json(updated);
    }

    // If updating admin account and not found by id
    if (id === 'admin' || role === 'ADMIN' || (email && String(email).toLowerCase().includes('admin'))) {
      const plainPass = password ? String(password).trim() : 'admin123';
      const password_hash = await bcrypt.hash(plainPass, 10);
      const adminPhone = dataToUpdate.phone || '9999999999';
      const adminEmail = dataToUpdate.email || 'admin@test.com';

      const adminUser = await prisma.user.upsert({
        where: { phone: adminPhone },
        update: { ...dataToUpdate, ...(password ? { password_hash } : {}) },
        create: {
          name: name || 'Admin',
          phone: adminPhone,
          email: adminEmail,
          role: 'ADMIN',
          password_hash,
          status: 'Active'
        }
      });
      return res.json(adminUser);
    }

    return res.status(404).json({ error: 'User not found' });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
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
