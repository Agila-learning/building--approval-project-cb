import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { phone, password } = req.body;
      const user = await prisma.user.findUnique({ where: { phone } });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, phone: user.phone },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      );

      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, phone: true, email: true, role: true },
      });
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
