import { Request, Response } from 'express';
import prisma from '../prisma';

export class TemplateController {
  async getTemplates(req: Request, res: Response) {
    try {
      const { approval_type, jurisdiction } = req.query;
      
      const templates = await prisma.checklistTemplate.findMany({
        where: {
          ...(approval_type ? { approval_type: approval_type as any } : {}),
          ...(jurisdiction ? { jurisdiction: jurisdiction as any } : {}),
        },
      });

      res.json(templates);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const templateController = new TemplateController();
