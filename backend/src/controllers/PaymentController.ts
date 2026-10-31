import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';
import { BrevoNotificationService } from '../services/BrevoNotificationService';

const brevoService = new BrevoNotificationService();

// Local file store for system settings (signature, company bank & QR details)
const SETTINGS_FILE = path.join(__dirname, '../../data/system_settings.json');

function ensureSettingsDir() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadStoredSettings(): any {
  try {
    ensureSettingsDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read system settings file:', err);
  }
  return {
    companyName: 'C.B. BUILDING APPROVALS',
    tagline: 'Your Approvals Our Responsibility',
    accountName: 'C.B. BUILDING APPROVALS',
    bankName: 'State Bank of India',
    accountNumber: '40123456789',
    ifscCode: 'SBIN0001234',
    branch: 'Shoolagiri Main Branch',
    upiId: 'cbapprovals@upi',
    qrCodeUrl: '',
    paymentInstructions: 'Scan QR code using Google Pay, PhonePe, Paytm or transfer to Bank Account. Enter Proposal Number in remarks.',
    adminSignature: '',
    adminName: 'Authorized Signatory',
    adminDesignation: 'Executive Administrator'
  };
}

export function saveStoredSettings(settings: any) {
  ensureSettingsDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export class PaymentController {
  // GET /settings
  async getSettings(req: Request, res: Response) {
    try {
      const settings = loadStoredSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /settings (Admin only)
  async updateSettings(req: Request, res: Response) {
    try {
      const userRole = (req.headers['x-user-role'] || req.query.role || '') as string;
      const userName = (req.headers['x-user-name'] || '') as string;
      const isAdmin = userRole.toUpperCase() === 'ADMIN' || userName.toLowerCase() === 'admin';

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only administrators can update company payment details and signature.' });
      }

      const current = loadStoredSettings();
      const updated = {
        ...current,
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      saveStoredSettings(updated);
      res.json({ success: true, settings: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /payments/verify
  async recordAndVerifyPayment(req: Request, res: Response) {
    try {
      const {
        caseId,
        amount,
        paymentMethod = 'UPI / QR Code',
        transactionId,
        paymentDate = new Date().toISOString(),
        paymentStatus = 'Paid',
        notes = '',
        sendEmail = true
      } = req.body;

      if (!caseId) {
        return res.status(400).json({ error: 'Case ID / Proposal Number is required.' });
      }

      const cleanAmount = parseFloat(String(amount || 0));
      if (isNaN(cleanAmount) || cleanAmount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required.' });
      }

      const cleanTxId = (transactionId || '').trim();
      if (paymentStatus === 'Paid' && !cleanTxId) {
        return res.status(400).json({ error: 'Transaction ID / UTR is required for verified payments.' });
      }

      // Find the case
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(caseId);
      const targetCase = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id: caseId }, { application_number: caseId }] }
          : { application_number: caseId },
        include: { property: true, assigned_staff: true }
      });

      if (!targetCase) {
        return res.status(404).json({ error: `Application not found for: ${caseId}` });
      }

      // PREVENT DUPLICATE PAYMENTS AND DUPLICATE TRANSACTION RECORDS
      if (cleanTxId) {
        const allCases = await prisma.case.findMany({
          select: { id: true, application_number: true, fullData: true }
        });

        for (const c of allCases) {
          const cFull = (c.fullData as any) || {};
          // Check primary payment
          if (cFull.payment?.transactionId && cFull.payment.transactionId.toUpperCase() === cleanTxId.toUpperCase()) {
            if (c.id !== targetCase.id) {
              return res.status(409).json({
                error: `Duplicate Transaction ID: "${cleanTxId}" has already been recorded for application #${c.application_number || c.id}.`
              });
            }
          }
          // Check payment history
          if (Array.isArray(cFull.paymentHistory)) {
            const dup = cFull.paymentHistory.find((p: any) => p.transactionId && p.transactionId.toUpperCase() === cleanTxId.toUpperCase());
            if (dup && c.id !== targetCase.id) {
              return res.status(409).json({
                error: `Duplicate Transaction ID: "${cleanTxId}" was already processed.`
              });
            }
          }
        }
      }

      const fullData = (targetCase.fullData as any) || {};
      const receiptNumber = fullData.payment?.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`;
      const userRole = (req.headers['x-user-role'] || '') as string;
      const verifiedBy = (req.headers['x-user-name'] as string) || (userRole.toUpperCase() === 'ADMIN' ? 'Admin' : 'Staff');

      const paymentRecord = {
        receiptNumber,
        amount: cleanAmount,
        paymentMethod,
        transactionId: cleanTxId,
        paymentDate: paymentDate || new Date().toISOString(),
        paymentStatus,
        verifiedBy,
        verifiedAt: new Date().toISOString(),
        notes
      };

      const paymentHistory = Array.isArray(fullData.paymentHistory) ? [...fullData.paymentHistory] : [];
      paymentHistory.push(paymentRecord);

      // Update fullData
      fullData.payment = paymentRecord;
      fullData.paymentHistory = paymentHistory;
      fullData.paidAmount = cleanAmount;
      fullData.feesAmount = fullData.feesAmount || cleanAmount;
      fullData.paymentStatus = paymentStatus;

      // Update Stages: Mark Payment Process as Completed
      if (Array.isArray(fullData.stages)) {
        fullData.stages = fullData.stages.map((st: any) => {
          if (st.key === 'stage_payment' || st.name?.toLowerCase().includes('payment')) {
            return {
              ...st,
              status: paymentStatus === 'Paid' ? 'Completed' : 'In Progress',
              completedDate: paymentStatus === 'Paid' ? new Date().toISOString() : st.completedDate,
              remarks: `Payment of ₹${cleanAmount.toLocaleString('en-IN')} received via ${paymentMethod}. TxID: ${cleanTxId}`
            };
          }
          // If next is Site Visit, ensure it is In Progress
          if ((st.key === 'stage_site_visit' || st.name?.toLowerCase().includes('site visit')) && paymentStatus === 'Paid') {
            if (st.status === 'Pending') {
              return { ...st, status: 'In Progress', startedDate: new Date().toISOString() };
            }
          }
          return st;
        });
      }

      const updatedCase = await prisma.case.update({
        where: { id: targetCase.id },
        data: {
          fullData,
          status: paymentStatus === 'Paid' ? 'PAYMENT_COMPLETED' : targetCase.status
        },
        include: { property: true, assigned_staff: true }
      });

      // Brevo Confirmation Email
      const customerEmail = targetCase.property?.owner_email || fullData.email || '';
      const customerName = targetCase.property?.owner_name || fullData.customerName || 'Customer';
      const proposalNumber = targetCase.application_number || targetCase.id;

      if (sendEmail && paymentStatus === 'Paid' && customerEmail) {
        try {
          const origin = req.headers.origin || 'http://localhost:5173';
          await brevoService.notifyPaymentSuccess({
            customerEmail,
            customerName,
            proposalNumber,
            amountPaid: cleanAmount,
            transactionId: cleanTxId,
            paymentDate: new Date(paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            paymentStatus: 'Paid',
            paymentMethod,
            receiptUrl: `${origin}/print/receipt/${proposalNumber}`
          });
          console.log(`Payment confirmation email dispatched to ${customerEmail}`);
        } catch (emailErr) {
          console.error('Failed to send payment confirmation email:', emailErr);
        }
      }

      // Create internal notification
      try {
        await prisma.notification.create({
          data: {
            title: `Payment Verified: ₹${cleanAmount.toLocaleString('en-IN')}`,
            message: `Verified payment of ₹${cleanAmount.toLocaleString('en-IN')} for Proposal #${proposalNumber} (TxID: ${cleanTxId}).`,
            type: 'payment',
            case_id: proposalNumber
          }
        });
      } catch (nErr) {
        console.warn('Failed to create payment notification:', nErr);
      }

      res.json({
        success: true,
        receiptNumber,
        payment: paymentRecord,
        case: updatedCase
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /payments
  async listPayments(req: Request, res: Response) {
    try {
      const userRole = (req.headers['x-user-role'] || req.query.role || '') as string;
      const staffName = (req.headers['x-user-name'] || req.query.staffName || req.query.staff || '') as string;
      const staffId = (req.headers['x-staff-id'] || req.query.staffId || '') as string;

      const whereCondition: any = {};

      // If Staff Member, only show their own payments
      let staffUserId = staffId;
      if (userRole.toUpperCase() === 'STAFF') {
        if (!staffUserId || !/^[0-9a-fA-F]{24}$/.test(staffUserId)) {
          if (staffName || staffId) {
            const userRecord = await prisma.user.findFirst({
              where: {
                OR: [
                  { name: { equals: String(staffName), mode: 'insensitive' } },
                  { staffId: { equals: String(staffId || staffName), mode: 'insensitive' } },
                  { email: { equals: String(staffName), mode: 'insensitive' } }
                ]
              }
            });
            if (userRecord) staffUserId = userRecord.id;
          }
        }

        const orClauses: any[] = [];
        if (staffUserId && /^[0-9a-fA-F]{24}$/.test(staffUserId)) {
          orClauses.push({ assigned_staff_id: staffUserId });
        }
        if (staffName) {
          orClauses.push({ assigned_staff: { name: { equals: String(staffName), mode: 'insensitive' } } });
          orClauses.push({ assigned_staff: { staffId: { equals: String(staffName), mode: 'insensitive' } } });
        }
        if (orClauses.length > 0) {
          whereCondition.OR = orClauses;
        }
      }

      const cases = await prisma.case.findMany({
        where: whereCondition,
        include: { property: true, assigned_staff: true, fees: true },
        orderBy: { updated_at: 'desc' }
      });

      const paymentsList: any[] = [];

      for (const c of cases) {
        const full = (c.fullData as any) || {};
        const pRecord = full.payment || {};
        const estimatedAmount = parseFloat(full.feesAmount || full.fees?.total || '0') || 0;
        const amountPaid = parseFloat(pRecord.amount || full.paidAmount || '0') || 0;
        const status = pRecord.paymentStatus || (amountPaid >= estimatedAmount && estimatedAmount > 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending');

        // Only include cases that have fee estimation or payment activity
        if (estimatedAmount > 0 || amountPaid > 0 || pRecord.transactionId) {
          const staffMemberName = c.assigned_staff?.name || full.staff || full.createdByStaff || 'Unassigned';

          // Ensure Staff can only see their own records
          if (userRole.toUpperCase() === 'STAFF') {
            const isStaffCase = (staffUserId && c.assigned_staff_id === staffUserId) ||
              (staffName && c.assigned_staff?.name && c.assigned_staff.name.toLowerCase() === staffName.toLowerCase()) ||
              (staffName && c.assigned_staff?.staffId && c.assigned_staff.staffId.toLowerCase() === staffName.toLowerCase()) ||
              (staffName && full.staff && String(full.staff).toLowerCase() === staffName.toLowerCase()) ||
              (staffName && full.createdByStaff && String(full.createdByStaff).toLowerCase() === staffName.toLowerCase());
            if (!isStaffCase) continue;
          }

          const proposalNumber = c.application_number || c.id;

          paymentsList.push({
            id: pRecord.receiptNumber || `PAY-${proposalNumber}`,
            caseId: c.id,
            proposalNumber,
            customerName: c.property?.owner_name || full.customerName || 'Customer',
            customerPhone: c.property?.owner_phone || full.mobile || '',
            customerEmail: c.property?.owner_email || full.email || '',
            staffMemberName,
            staffId: c.assigned_staff_id,
            applicationType: c.approval_type || 'Building Plan Approval',
            estimatedAmount,
            amountPaid,
            pendingAmount: Math.max(0, estimatedAmount - amountPaid),
            transactionId: pRecord.transactionId || '—',
            paymentDate: pRecord.paymentDate || c.created_at,
            paymentMethod: pRecord.paymentMethod || 'UPI / QR Code',
            paymentStatus: status,
            receiptNumber: pRecord.receiptNumber || `RCP-${proposalNumber.slice(-6)}`,
            receiptUrl: `/print/receipt/${proposalNumber}`,
            notes: pRecord.notes || ''
          });
        }
      }

      res.json(paymentsList);
    } catch (error: any) {
      console.error('Error listing payments:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const paymentController = new PaymentController();
