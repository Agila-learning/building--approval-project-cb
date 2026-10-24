import { Request, Response } from 'express';
import prisma from '../prisma';

export class DashboardController {
  async getSummary(req: Request, res: Response) {
    try {
      const countsByStatus = await prisma.case.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      // Dummy calculation for overdue cases for now
      const overdueCases = await prisma.case.count({
        where: {
          status: { notIn: ['APPROVED', 'CLOSED'] },
          updated_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days old
        },
      });

      // This month revenue
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const feesAgg = await prisma.fee.aggregate({
        where: {
          paid: true,
          created_at: { gte: firstDayOfMonth },
        },
        _sum: { amount: true },
      });

      res.json({
        countsByStatus,
        overdueCases,
        thisMonthRevenue: feesAgg._sum.amount || 0,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const dashboardController = new DashboardController();
