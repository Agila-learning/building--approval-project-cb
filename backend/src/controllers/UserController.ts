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

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, password, status, role = 'STAFF' } = req.body;

    const existing = await prisma.user.findUnique({ where: { phone: mobile } });
    if (existing) {
      return res.status(400).json({ error: 'Mobile number already exists' });
    }

    const password_hash = await bcrypt.hash(password || 'password123', 10);

    const count = await prisma.user.count({ where: { role: 'STAFF' } });
    const formattedCount = String(count + 1).padStart(3, '0');
    const staffId = `EMP-${formattedCount}`;

    const newUser = await prisma.user.create({
      data: {
        staffId,
        name,
        phone: mobile,
        email: email || null,
        password_hash,
        status: status || 'Active',
        role
      }
    });
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
