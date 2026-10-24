import { Request, Response } from 'express';
import prisma from '../prisma';

export class DocumentController {
  async uploadDocument(req: Request, res: Response) {
    try {
      const { caseId, document_type } = req.body;
      const file = req.file;
      const userId = (req as any).user?.id || 'admin'; // Fallback for dev

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create document record in database
      const doc = await prisma.document.create({
        data: {
          case_id: caseId,
          document_type: document_type,
          file_key: file.path, // Cloudinary URL
          uploaded_by: userId,
        },
      });

      res.json({ message: 'Document uploaded successfully', document: doc, url: file.path });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSignedUrl(req: Request, res: Response) {
    try {
      const { caseId } = req.params;
      const { document_type, file_name } = req.body;
      const userId = (req as any).user.id;
      
      const caseData = await prisma.case.findUnique({ where: { id: caseId as string } });
      if (!caseData) return res.status(404).json({ error: 'Case not found' });

      // Stub S3 Signed URL Generation
      const file_key = `cases/${caseId}/${document_type}_${Date.now()}_${file_name}`;
      const uploadUrl = `https://s3.stub.endpoint/upload?key=${file_key}`;

      // Create document record in database pending upload
      const doc = await prisma.document.create({
        data: {
          case_id: caseId as string,
          document_type,
          file_key,
          uploaded_by: userId,
        },
      });

      res.json({ uploadUrl, file_key, document: doc });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { verified } = req.body;

      const updatedDoc = await prisma.document.update({
        where: { id: id as string },
        data: { verified },
      });

      res.json(updatedDoc);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const documentController = new DocumentController();
