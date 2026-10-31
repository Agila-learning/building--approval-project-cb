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

      // Create document record in database if caseId is provided
      let doc = null;
      if (caseId) {
        doc = await prisma.document.create({
          data: {
            case_id: caseId,
            document_type: document_type || 'OTHER',
            file_key: file.path, // Cloudinary URL
            uploaded_by: userId,
          },
        });

        try {
          await prisma.notification.create({
            data: {
              title: `Document Uploaded: ${document_type || 'File'}`,
              message: `Document "${document_type || 'File'}" was uploaded for application ${caseId}.`,
              type: 'document_uploaded',
              case_id: String(caseId)
            }
          });
        } catch (nErr) {
          console.error("Failed to create notification on document upload:", nErr);
        }
      }

      res.json({
        message: 'Document uploaded successfully',
        document: doc,
        url: file.path,
        secure_url: file.path,
      });
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

      try {
        await prisma.notification.create({
          data: {
            title: `Document ${verified ? 'Verified' : 'Flagged'}`,
            message: `Document "${updatedDoc.document_type}" was ${verified ? 'verified successfully' : 'flagged for reupload'}.`,
            type: 'document_verification',
            case_id: updatedDoc.case_id
          }
        });
      } catch (nErr) {
        console.error("Failed to create notification on verifyDocument:", nErr);
      }

      res.json(updatedDoc);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async listDocuments(req: Request, res: Response) {
    try {
      const userRole = (req.headers['x-user-role'] || req.query.role || '') as string;
      const staffName = (req.headers['x-user-name'] || req.query.staffName || req.query.staff || '') as string;
      const staffId = (req.headers['x-staff-id'] || req.query.staffId || '') as string;
      const isAdmin = userRole.toUpperCase() === 'ADMIN' || staffName.toLowerCase() === 'admin';

      const whereCondition: any = {};
      if (!isAdmin && userRole.toUpperCase() === 'STAFF') {
        const orClauses: any[] = [];
        if (staffId && /^[0-9a-fA-F]{24}$/.test(staffId)) {
          orClauses.push({ assigned_staff_id: staffId });
        }
        if (staffName) {
          orClauses.push({ assigned_staff: { name: { equals: String(staffName), mode: 'insensitive' } } });
        }
        if (orClauses.length === 0) return res.json([]);
        whereCondition.OR = orClauses;
      }

      const cases = await prisma.case.findMany({
        where: whereCondition,
        include: { property: true, assigned_staff: true, documents: true },
        orderBy: { created_at: 'desc' }
      });

      const docsList: any[] = [];

      const formatDocLabel = (key: string): string => {
        const u = key.toUpperCase();
        if (u.includes('PHOTOGRAPH') || u.includes('PHOTO')) return 'Customer Photograph';
        if (u.includes('SIGNATURE') && !u.includes('PROPERTY')) return 'Customer Signature';
        if (u.includes('AADHAR')) return 'Aadhaar Card';
        if (u.includes('PAN')) return 'PAN Card';
        if (u.includes('SALE DEED') || u.includes('LAND DOCUMENT') || u.includes('TITLE DEED')) return 'Sale Deed / Land Document';
        if (u.includes('PATTA')) return 'Patta Copy';
        if (u.includes('BUILDING PLAN')) return 'Proposed Building Plan';
        if (u.includes('FMB')) return 'FMB Sketch';
        if (u.includes('EC') || u.includes('ENCUMBRANCE')) return 'Encumbrance Certificate (EC)';
        if (u.includes('TAX')) return 'Property Tax Receipt';
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      };

      for (const c of cases) {
        const customerName = c.property?.owner_name || (c.fullData as any)?.customerName || 'Customer';
        const proposalNumber = c.application_number || c.id;
        const customerPhone = c.property?.owner_phone || (c.fullData as any)?.mobile || '';
        const assignedWorker = c.assigned_staff?.name || (c.fullData as any)?.staff || (c.fullData as any)?.createdByStaff || 'Unassigned';
        const docVerification = (c.fullData as any)?.documentVerification || {};
        const requestedReuploads = Array.isArray((c.fullData as any)?.requestedReuploads) ? (c.fullData as any).requestedReuploads : [];

        // Check uploadedFiles in fullData or case
        const uploadedFiles = (c.uploadedFiles as Record<string, string>) || {};
        const full = (c.fullData as any) || {};

        // Merge any aadhar/pan/files from fullData if not in uploadedFiles
        const combinedFiles: Record<string, string> = { ...uploadedFiles };
        if (full.aadharFile && !combinedFiles['AADHAR CARD']) combinedFiles['AADHAR CARD'] = full.aadharFile;
        if (full.panFile && !combinedFiles['PAN CARD']) combinedFiles['PAN CARD'] = full.panFile;
        if (full.applicant?.aadharFile && !combinedFiles['AADHAR CARD']) combinedFiles['AADHAR CARD'] = full.applicant.aadharFile;
        if (full.applicant?.panFile && !combinedFiles['PAN CARD']) combinedFiles['PAN CARD'] = full.applicant.panFile;

        // Deduplication tracker: merge aliases like SALE DEED and LAND DOCUMENT with same or duplicate intent
        const processedDocGroups = new Set<string>();

        for (const [rawKey, val] of Object.entries(combinedFiles)) {
          if (!val || typeof val !== 'string' || ['username', 'password', 'receiptNumber'].includes(rawKey)) continue;

          let normalizedDocKey = rawKey.trim();
          const upperKey = normalizedDocKey.toUpperCase();

          // Standardize alias groupings to avoid double-time duplicates
          let groupKey = upperKey;
          if (upperKey === 'LAND DOCUMENT' || upperKey === 'SALE DEED' || upperKey === 'SALE_DEED' || upperKey === 'LAND_DOCUMENT') {
            groupKey = 'SALE DEED';
            normalizedDocKey = 'SALE DEED';
          } else if (upperKey.includes('AADHAR')) {
            groupKey = 'AADHAR CARD';
            normalizedDocKey = 'AADHAR CARD';
          } else if (upperKey.includes('PAN')) {
            groupKey = 'PAN CARD';
            normalizedDocKey = 'PAN CARD';
          } else if (upperKey.includes('PHOTOGRAPH') || upperKey.includes('PHOTO')) {
            groupKey = 'CUSTOMER PHOTOGRAPH';
            normalizedDocKey = 'CUSTOMER PHOTOGRAPH';
          } else if (upperKey.includes('SIGNATURE') && !upperKey.includes('PROPERTY')) {
            groupKey = 'CUSTOMER SIGNATURE';
            normalizedDocKey = 'CUSTOMER SIGNATURE';
          }

          if (processedDocGroups.has(groupKey)) continue;
          processedDocGroups.add(groupKey);

          // Get verification status
          const verification = docVerification[normalizedDocKey] || docVerification[rawKey] || {};
          let status: 'Pending Review' | 'Verified' | 'Re-upload Required' = 'Pending Review';
          if (verification.status === 'Verified') {
            status = 'Verified';
          } else if (verification.status === 'Re-upload Required' || requestedReuploads.includes(normalizedDocKey) || requestedReuploads.includes(rawKey)) {
            status = 'Re-upload Required';
          }

          // Category classification
          let category = 'Other';
          if (groupKey.includes('SALE DEED')) category = 'Sale Deed';
          else if (groupKey.includes('PATTA')) category = 'Patta';
          else if (groupKey.includes('ENCUMBRANCE') || groupKey.includes('EC')) category = 'Encumbrance Certificate';
          else if (groupKey.includes('BUILDING PLAN')) category = 'Building Plan';
          else if (groupKey.includes('AADHAR') || groupKey.includes('PAN') || groupKey.includes('PHOTOGRAPH') || groupKey.includes('SIGNATURE')) category = 'ID Proof';
          else if (groupKey.includes('FMB')) category = 'FMB';

          docsList.push({
            id: `${c.id}_${normalizedDocKey}`,
            caseId: c.id,
            proposalNumber,
            customerName,
            customerPhone,
            docKey: normalizedDocKey,
            documentKey: normalizedDocKey,
            documentType: normalizedDocKey,
            name: formatDocLabel(normalizedDocKey),
            category,
            uploadedAt: verification.uploadedAt || c.created_at,
            status,
            verificationStatus: status,
            verifiedBy: verification.verifiedBy || (status === 'Verified' ? 'Admin' : '—'),
            verifiedAt: verification.verifiedAt || null,
            reuploadReason: verification.rejectionReason || verification.reuploadReason || '',
            rejectionReason: verification.rejectionReason || verification.reuploadReason || '',
            fileUrl: val,
            assignedWorker,
            assignedWorkerId: c.assigned_staff_id
          });
        }
      }

      res.json(docsList);
    } catch (err: any) {
      console.error('Error listing documents:', err);
      res.status(500).json({ error: err.message });
    }
  }

  async updateDocumentStatus(req: Request, res: Response) {
    try {
      const { caseId, status, rejectionReason, reuploadReason } = req.body;
      const documentKey = req.body.documentKey || req.body.docKey;

      if (!documentKey) {
        return res.status(400).json({ error: 'Document key (docKey) is required.' });
      }

      const userRole = (req.headers['x-user-role'] || req.query.role || '') as string;
      const userName = (req.headers['x-user-name'] || '') as string;
      const isAdmin = userRole.toUpperCase() === 'ADMIN' || userName.toLowerCase() === 'admin';
      const verifiedBy = userName || (isAdmin ? 'Admin' : 'Staff');

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(caseId);
      const targetCase = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id: caseId }, { application_number: caseId }] }
          : { application_number: caseId },
        include: { assigned_staff: true, property: true }
      });

      if (!targetCase) return res.status(404).json({ error: 'Case not found' });

      // If worker (and NOT admin), check assignment isolation
      if (!isAdmin && userRole.toUpperCase() === 'STAFF') {
        const staffName = req.headers['x-user-name'] as string;
        const staffId = req.headers['x-staff-id'] as string;
        const isAssigned = (staffId && targetCase.assigned_staff_id === staffId) ||
          (staffName && targetCase.assigned_staff?.name?.toLowerCase() === staffName.toLowerCase());
        if (!isAssigned) {
          return res.status(403).json({ error: 'Forbidden: You are not assigned to review documents for this application.' });
        }
      }

      const fullData = (targetCase.fullData as any) || {};
      const docVerification = fullData.documentVerification || {};
      let requestedReuploads: string[] = Array.isArray(fullData.requestedReuploads) ? [...fullData.requestedReuploads] : [];

      const reasonToSave = status === 'Re-upload Required' ? (reuploadReason || rejectionReason || 'Please upload a clearer copy.') : '';

      docVerification[documentKey] = {
        status, // 'Verified' | 'Pending Review' | 'Re-upload Required'
        rejectionReason: reasonToSave,
        reuploadReason: reasonToSave,
        verifiedBy,
        verifiedAt: new Date().toISOString()
      };

      if (status === 'Re-upload Required') {
        if (!requestedReuploads.includes(documentKey)) requestedReuploads.push(documentKey);
      } else {
        requestedReuploads = requestedReuploads.filter(k => k !== documentKey);
      }

      fullData.documentVerification = docVerification;
      fullData.requestedReuploads = requestedReuploads;

      const updated = await prisma.case.update({
        where: { id: targetCase.id },
        data: { fullData }
      });

      // Notification
      try {
        await prisma.notification.create({
          data: {
            title: `Document ${status}: ${documentKey}`,
            message: `${documentKey} was marked as ${status} by ${verifiedBy} for proposal ${targetCase.application_number}.`,
            type: 'document_verification',
            case_id: targetCase.application_number
          }
        });
      } catch (nErr) {
        console.warn('Failed to create notification on doc status change:', nErr);
      }

      res.json({ success: true, case: updated });
    } catch (err: any) {
      console.error('Error updating document status:', err);
      res.status(500).json({ error: err.message });
    }
  }
}

export const documentController = new DocumentController();

