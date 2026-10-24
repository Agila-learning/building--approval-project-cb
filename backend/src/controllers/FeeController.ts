import { Request, Response } from 'express';
import prisma from '../prisma';

export class FeeController {
  async addFee(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const data = { ...req.body, case_id: caseId };
      const fee = await prisma.fee.create({ data });
      res.status(201).json(fee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { receipt_document_id } = req.body;
      
      const updatedFee = await prisma.fee.update({
        where: { id: id as string },
        data: { paid: true, receipt_document_id },
      });

      res.json(updatedFee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const feeController = new FeeController();
