import { Request, Response } from 'express';
import prisma from '../prisma';
import { BrevoNotificationService } from '../services/BrevoNotificationService';

const notificationService = new BrevoNotificationService();

export class CaseController {
  async createCase(req: Request, res: Response) {
    console.log("createCase hit with body:", req.body);
    try {
      const data = req.body;

      // 1. Mobile Number Validation: Must be 10 digits starting with 6, 7, 8, or 9
      const rawMobile = data.fullData?.mobile || data.property?.owner_phone || data.mobile;
      const cleanMobile = rawMobile ? String(rawMobile).trim().replace(/\D/g, '').slice(-10) : '';
      if (cleanMobile && !/^[6-9]\d{9}$/.test(cleanMobile)) {
        return res.status(400).json({ error: 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
      }

      // 2. Email Validation
      const rawEmail = data.fullData?.email || data.property?.owner_email || data.email;
      const cleanEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : '';
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address containing @ and a valid domain.' });
      }

      // 3. Aadhar Validation (12 digits)
      const rawAadhar = data.fullData?.aadhar;
      if (rawAadhar) {
        const cleanAadhar = String(rawAadhar).replace(/\s/g, '');
        if (!/^\d{12}$/.test(cleanAadhar)) {
          return res.status(400).json({ error: 'Aadhar number must be exactly 12 digits.' });
        }
      }

      // 4. PAN Validation (5 uppercase letters, 4 digits, 1 uppercase letter)
      const rawPan = data.fullData?.pan;
      if (rawPan) {
        const cleanPan = String(rawPan).trim().toUpperCase();
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
          return res.status(400).json({ error: 'PAN number must be a valid 10-character alphanumeric format (e.g. ABCDE1234F).' });
        }
      }
      
      let application_number = data.application_number;
      if (!application_number) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const count = await prisma.case.count({
          where: {
            created_at: {
              gte: startOfDay,
            }
          }
        });
        
        const formattedCount = String(count + 1).padStart(3, '0');
        application_number = `APP-${yy}${mm}${dd}-${formattedCount}`;
      }

      // Handle property creation or link
      let property_id = data.property_id;
      if (!property_id && data.property) {
        const prop = data.property.create || data.property;
        if (prop && (prop.owner_name || prop.address || prop.village)) {
          const newProperty = await prisma.property.create({
            data: {
              owner_name: prop.owner_name || data.fullData?.customerName || 'Draft Owner',
              owner_phone: cleanMobile || prop.owner_phone || '9999999999',
              owner_email: cleanEmail || prop.owner_email || null,
              address: prop.address || '',
              village: prop.village || '',
              taluk: prop.taluk || '',
              survey_number: prop.survey_number || 'TBD',
              plot_area: prop.plot_area || null,
              built_up_area: prop.built_up_area || null,
              floors: prop.floors || null,
              property_type: prop.property_type || null
            }
          });
          property_id = newProperty.id;
        }
      }

      // Check if staff name needs resolving to assigned_staff_id
      let assigned_staff_id = data.assigned_staff_id;
      if (!assigned_staff_id && data.assigned_staff?.name) {
        const staff = await prisma.user.findFirst({
          where: { name: { contains: data.assigned_staff.name, mode: 'insensitive' } }
        });
        if (staff) assigned_staff_id = staff.id;
      }

      const validApprovalTypes = ['LAYOUT_APPROVAL', 'BUILDING_PLAN_APPROVAL', 'COMPLETION_CERTIFICATE', 'PATTA_TRANSFER'];
      let approval_type = data.approval_type;
      if (approval_type === 'BUILDING_PLAN' || approval_type === 'building') {
        approval_type = 'BUILDING_PLAN_APPROVAL';
      } else if (!approval_type || !validApprovalTypes.includes(approval_type)) {
        approval_type = 'BUILDING_PLAN_APPROVAL';
      }

      const validStatuses = ['DOCUMENTS_PENDING', 'DOCUMENTS_VERIFICATION', 'INTAKE', 'DOCUMENT_COLLECTION', 'APPLICATION_PREP', 'SUBMITTED', 'SCRUTINY', 'ACTION_NEEDED', 'INSPECTION_SCHEDULED', 'INSPECTION_DONE', 'APPROVED', 'CLOSED'];
      let caseStatus = data.status;
      if (!caseStatus || !validStatuses.includes(caseStatus) || caseStatus === 'INTAKE') {
        caseStatus = (data.uploadedFiles && Object.keys(data.uploadedFiles).some(k => !['username', 'password', 'receiptNumber'].includes(k) && Boolean(data.uploadedFiles[k])))
          ? 'DOCUMENTS_VERIFICATION'
          : 'DOCUMENTS_PENDING';
      }

      const newCase = await prisma.case.create({ 
        data: {
          application_number: String(application_number),
          approval_type: approval_type,
          status: caseStatus,
          property_id: property_id || null,
          assigned_staff_id: assigned_staff_id || null,
          fullData: data.fullData || null,
          uploadedFiles: data.uploadedFiles || null,
          linkTracking: data.linkTracking || null,
          reason: data.reason || null
        },
        include: {
          property: true,
          assigned_staff: true,
          documents: true,
          fees: true
        }
      });

      console.log("Created case in MongoDB:", newCase.id, newCase.application_number);

      const customerName = newCase.property?.owner_name || data.fullData?.customerName || 'Valued Applicant';
      const customerEmail = cleanEmail || newCase.property?.owner_email;

      // 5. Create real database notification
      try {
        await prisma.notification.create({
          data: {
            title: 'New Application Submitted',
            message: `${customerName} submitted application ${newCase.application_number}`,
            type: 'APPLICATION',
            case_id: newCase.id,
            read: false,
          }
        });
      } catch (notifErr) {
        console.error("Failed to create DB notification:", notifErr);
      }

      // 6. Send Email Confirmation via Brevo with Reference Number & Mobile Number
      if (customerEmail) {
        const origin = req.headers.origin || 'http://localhost:5175';
        notificationService.notifyApplicationSubmitted({
          customerEmail,
          customerName,
          applicationNumber: newCase.application_number as string,
          mobileNumber: cleanMobile,
          propertyAddress: newCase.property?.address || data.fullData?.propertyDetails?.streetName,
          trackUrl: `${origin}/track?app=${newCase.application_number}&mobile=${cleanMobile}`
        }).catch(err => {
          console.error("Failed to send application confirmation email via Brevo:", err);
        });
      }

      res.status(201).json(newCase);
    } catch (error: any) {
      console.error("Error creating case:", error);
      res.status(400).json({ error: error.message });
    }
  }

  async getCase(req: Request, res: Response) {
    try {
      const rawId = req.params.id as string;
      const cleanId = rawId.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
      const withPrefix = cleanId.startsWith('APP-') ? cleanId : `APP-${cleanId}`;
      const withoutPrefix = cleanId.replace(/^APP-/, '');

      const caseData = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id: cleanId }, { application_number: cleanId }, { application_number: withPrefix }, { application_number: withoutPrefix }] }
          : { OR: [{ application_number: cleanId }, { application_number: withPrefix }, { application_number: withoutPrefix }] },
        include: {
          documents: true,
          fees: true,
          status_history: true,
          child_cases: true,
          property: true,
          assigned_staff: true,
        },
      });

      if (!caseData) return res.status(404).json({ error: 'Case not found' });
      res.json(caseData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async listCases(req: Request, res: Response) {
    try {
      const { status, jurisdiction, assigned_staff_id } = req.query;
      
      const cases = await prisma.case.findMany({
        where: {
          ...(status ? { status: String(status) } : {}),
          ...(assigned_staff_id ? { assigned_staff_id: String(assigned_staff_id) } : {}),
        },
        include: { property: true, assigned_staff: true, documents: true },
        orderBy: { created_at: 'desc' }
      });
      res.json(cases);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCase(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

      const existing = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id }, { application_number: id }] }
          : { application_number: id },
        include: { property: true }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Case not found' });
      }

      // Update property if provided
      if (data.property && existing.property_id) {
        const prop = data.property.update || data.property;
        await prisma.property.update({
          where: { id: existing.property_id },
          data: {
            owner_name: prop.owner_name !== undefined ? prop.owner_name : undefined,
            owner_phone: prop.owner_phone !== undefined ? prop.owner_phone : undefined,
            owner_email: prop.owner_email !== undefined ? prop.owner_email : undefined,
            address: prop.address !== undefined ? prop.address : undefined,
            village: prop.village !== undefined ? prop.village : undefined,
            taluk: prop.taluk !== undefined ? prop.taluk : undefined,
            survey_number: prop.survey_number !== undefined ? prop.survey_number : undefined,
          }
        });
      } else if (data.property && !existing.property_id) {
        const prop = data.property.create || data.property;
        const newProperty = await prisma.property.create({
          data: {
            owner_name: prop.owner_name || data.fullData?.customerName || 'Draft Owner',
            owner_phone: prop.owner_phone || data.fullData?.mobile || '0000000000',
            address: prop.address || '',
            village: prop.village || '',
            taluk: prop.taluk || '',
            survey_number: prop.survey_number || 'TBD',
          }
        });
        await prisma.case.update({
          where: { id: existing.id },
          data: { property_id: newProperty.id }
        });
      }

      const updatePayload: any = {};
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.approval_type !== undefined) updatePayload.approval_type = data.approval_type;
      if (data.approval_number !== undefined) updatePayload.approval_number = data.approval_number;
      if (data.fullData !== undefined) updatePayload.fullData = data.fullData;
      if (data.uploadedFiles !== undefined) updatePayload.uploadedFiles = data.uploadedFiles;
      if (data.linkTracking !== undefined) updatePayload.linkTracking = data.linkTracking;
      if (data.reason !== undefined) updatePayload.reason = data.reason;

      const updated = await prisma.case.update({
        where: { id: existing.id },
        data: updatePayload,
        include: { property: true, assigned_staff: true, documents: true }
      });

      // Create real-time notification on step/status update or document update
      try {
        if (data.status && data.status !== existing.status) {
          await prisma.notification.create({
            data: {
              title: `Step Updated: ${updated.application_number}`,
              message: `Application advanced to status "${updated.status}" for ${updated.property?.owner_name || 'applicant'}.`,
              type: 'case_status_update',
              case_id: updated.application_number
            }
          });
        } else if (data.uploadedFiles && JSON.stringify(data.uploadedFiles) !== JSON.stringify(existing.uploadedFiles)) {
          await prisma.notification.create({
            data: {
              title: `Documents Updated: ${updated.application_number}`,
              message: `New or modified documents saved for ${updated.property?.owner_name || 'applicant'}.`,
              type: 'document_uploaded',
              case_id: updated.application_number
            }
          });
        }
      } catch (nErr) {
        console.error("Failed to create notification on updateCase:", nErr);
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating case:", error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status, note } = req.body;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

      const found = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id }, { application_number: id }] }
          : { application_number: id }
      });

      if (!found) return res.status(404).json({ error: 'Case not found' });

      const updated = await prisma.case.update({
        where: { id: found.id },
        data: { status },
        include: { property: true, assigned_staff: true }
      });

      // Record in status history
      try {
        const userId = (req as any).user?.id || null;
        await prisma.statusHistory.create({
          data: {
            case_id: found.id,
            from_status: found.status || 'INTAKE',
            to_status: status,
            changed_by: userId,
            note: note || `Status updated to ${status}`
          }
        });
      } catch (histErr) {
        console.warn("Status history logging skipped:", histErr);
      }

      // Create real-time notification for step change
      try {
        await prisma.notification.create({
          data: {
            title: `Step Changed: ${updated.application_number}`,
            message: `Status moved from "${found.status}" to "${status}" for ${updated.property?.owner_name || 'applicant'}.`,
            type: 'case_step_change',
            case_id: updated.application_number
          }
        });
      } catch (nErr) {
        console.error("Failed to create notification on updateStatus:", nErr);
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCase(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

      const found = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id }, { application_number: id }] }
          : { application_number: id }
      });

      if (!found) return res.status(404).json({ error: 'Case not found' });

      await prisma.case.delete({ where: { id: found.id } });
      res.json({ message: 'Case deleted successfully', id: found.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const caseController = new CaseController();
