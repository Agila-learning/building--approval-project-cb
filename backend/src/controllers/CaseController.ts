import { Request, Response } from 'express';
import prisma from '../prisma';
import { BrevoNotificationService } from '../services/BrevoNotificationService';

const notificationService = new BrevoNotificationService();

export function buildDefaultStages(caseData?: any) {
  const currentStatus = (caseData?.status || 'Application Submitted').toUpperCase();
  const now = new Date().toISOString();
  const createdDate = caseData?.created_at ? new Date(caseData.created_at).toISOString() : now;

  const isCompletedStage = (key: string) => {
    if (['APPLICATION COMPLETED', 'APPROVED', 'CLOSED'].includes(currentStatus)) return true;
    if (key === 'stage_submitted') return true;
    if (key === 'stage_doc_verification') {
      return ['PAYMENT PROCESS', 'SITE VISIT', 'FINAL REVIEW', 'APPLICATION COMPLETED', 'APPROVED', 'CLOSED', 'DOCUMENTS_VERIFIED', 'SUBMITTED_FOR_APPROVAL'].includes(currentStatus);
    }
    if (key === 'stage_payment') {
      return ['SITE VISIT', 'FINAL REVIEW', 'APPLICATION COMPLETED', 'APPROVED', 'CLOSED'].includes(currentStatus);
    }
    if (key === 'stage_site_visit') {
      return ['FINAL REVIEW', 'APPLICATION COMPLETED', 'APPROVED', 'CLOSED'].includes(currentStatus);
    }
    if (key === 'stage_final_review') {
      return ['APPLICATION COMPLETED', 'APPROVED', 'CLOSED'].includes(currentStatus);
    }
    return false;
  };

  const isInProgressStage = (key: string) => {
    if (['APPLICATION COMPLETED', 'APPROVED', 'CLOSED'].includes(currentStatus)) return false;
    if (key === 'stage_submitted') return false;
    if (key === 'stage_doc_verification') {
      return ['APPLICATION SUBMITTED', 'DOCUMENTS_VERIFICATION', 'DOCUMENTS_PENDING', 'DOCUMENT_COLLECTION', 'INTAKE', 'SUBMITTED', 'NEW', 'DRAFT'].includes(currentStatus);
    }
    if (key === 'stage_payment') return currentStatus === 'PAYMENT PROCESS';
    if (key === 'stage_site_visit') return ['SITE VISIT', 'INSPECTION_SCHEDULED', 'INSPECTION_DONE'].includes(currentStatus);
    if (key === 'stage_final_review') return ['FINAL REVIEW', 'SCRUTINY'].includes(currentStatus);
    return false;
  };

  const assignedWorker = caseData?.assigned_staff?.name || (caseData?.fullData as any)?.staff || 'Unassigned';

  return [
    {
      name: 'Application Submitted',
      key: 'stage_submitted',
      status: 'Completed',
      startedDate: createdDate,
      completedDate: createdDate,
      remarks: 'Application registered and initial details submitted.',
      responsiblePerson: 'Customer'
    },
    {
      name: 'Document Verification',
      key: 'stage_doc_verification',
      status: isCompletedStage('stage_doc_verification') ? 'Completed' : (isInProgressStage('stage_doc_verification') ? 'In Progress' : 'Pending'),
      startedDate: createdDate,
      completedDate: isCompletedStage('stage_doc_verification') ? createdDate : null,
      remarks: 'Identity, ownership, and plan documents scrutiny.',
      responsiblePerson: assignedWorker !== 'Unassigned' ? assignedWorker : 'Admin'
    },
    {
      name: 'Payment Process',
      key: 'stage_payment',
      status: isCompletedStage('stage_payment') ? 'Completed' : (isInProgressStage('stage_payment') ? 'In Progress' : 'Pending'),
      startedDate: (isInProgressStage('stage_payment') || isCompletedStage('stage_payment')) ? createdDate : null,
      completedDate: isCompletedStage('stage_payment') ? createdDate : null,
      remarks: 'Statutory fees calculation and payment receipt verification.',
      responsiblePerson: 'Admin'
    },
    {
      name: 'Site Visit',
      key: 'stage_site_visit',
      status: isCompletedStage('stage_site_visit') ? 'Completed' : (isInProgressStage('stage_site_visit') ? 'In Progress' : 'Pending'),
      startedDate: (isInProgressStage('stage_site_visit') || isCompletedStage('stage_site_visit')) ? createdDate : null,
      completedDate: isCompletedStage('stage_site_visit') ? createdDate : null,
      remarks: 'Physical field inspection and boundary verification.',
      responsiblePerson: assignedWorker !== 'Unassigned' ? assignedWorker : 'Field Officer'
    },
    {
      name: 'Final Review',
      key: 'stage_final_review',
      status: isCompletedStage('stage_final_review') ? 'Completed' : (isInProgressStage('stage_final_review') ? 'In Progress' : 'Pending'),
      startedDate: (isInProgressStage('stage_final_review') || isCompletedStage('stage_final_review')) ? createdDate : null,
      completedDate: isCompletedStage('stage_final_review') ? createdDate : null,
      remarks: 'Executive review, compliance check, and sanction order preparation.',
      responsiblePerson: 'Admin'
    },
    {
      name: 'Application Completed',
      key: 'stage_completed',
      status: isCompletedStage('stage_completed') ? 'Completed' : 'Pending',
      startedDate: isCompletedStage('stage_completed') ? createdDate : null,
      completedDate: isCompletedStage('stage_completed') ? createdDate : null,
      remarks: 'Official building plan approval order sanctioned and issued.',
      responsiblePerson: 'Admin'
    }
  ];
}

export class CaseController {
  async createCase(req: Request, res: Response) {
    console.log("createCase hit with body:", req.body);
    try {
      const data = req.body;
      const userRole = (req.headers['x-user-role'] || req.query.role || (req as any).user?.role || '') as string;
      const isAdmin = userRole.toUpperCase() === 'ADMIN' || (req as any).user?.role === 'ADMIN';
      const isDraft = data.status === 'Draft' || data.status === 'LEAD' || data.status === 'Lead' || data.isPartial === true || userRole.toUpperCase() === 'STAFF' || Boolean(data.fullData?.staff) || !data.uploadedFiles;

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

      // 5. PIN Code Validation: Exactly 6 digits only, numbers only!
      const resPincode = data.fullData?.residentialAddress?.pincode || data.fullData?.pincode || data.property?.pincode;
      const permPincode = data.fullData?.permanentAddress?.pincode;
      const propPincode = data.fullData?.propertyDetails?.pincode || data.property?.pincode;

      if (!isDraft) {
        if (!resPincode || !/^\d{6}$/.test(String(resPincode).trim())) {
          return res.status(400).json({ error: 'PIN code must be exactly 6 digits (numbers only).' });
        }
        if (data.fullData?.permanentAddress?.sameAsResidential === false && permPincode) {
          if (!/^\d{6}$/.test(String(permPincode).trim())) {
            return res.status(400).json({ error: 'Permanent address PIN code must be exactly 6 digits (numbers only).' });
          }
        }
      }
      if (propPincode && !/^\d{6}$/.test(String(propPincode).trim())) {
        return res.status(400).json({ error: 'Property PIN code must be exactly 6 digits (numbers only).' });
      }

      // 6. Mandatory Document Upload Validation:
      // Customers must upload all required documents before submitting their application.
      // If any required document is missing, prevent submission.
      if (!isDraft) {
        const uploaded = data.uploadedFiles || data.fullData?.documents || {};
        const requiredDocSpecs = [
          { key: 'CUSTOMER PHOTOGRAPH', alts: ['photo', 'customer_photo'], label: 'Applicant Photograph' },
          { key: 'CUSTOMER SIGNATURE', alts: ['signature', 'customer_signature'], label: 'Applicant Signature' },
          { key: 'AADHAR CARD', alts: ['aadhar', 'aadhar_card'], label: 'Aadhar Card' },
          { key: 'PAN CARD', alts: ['pan', 'pan_card'], label: 'PAN Card' },
          { key: 'SALE DEED', alts: ['sale_deed', 'LAND DOCUMENT', 'land_document'], label: 'Sale Deed / Land Document' },
          { key: 'PATTA', alts: ['patta', 'patta_copy'], label: 'Patta Document' },
          { key: 'BUILDING PLAN', alts: ['building_plan', 'proposed_plan'], label: 'Building Plan' },
        ];

        const missingDocs: string[] = [];
        for (const spec of requiredDocSpecs) {
          const hasFile = Boolean(uploaded[spec.key]) || spec.alts.some(alt => Boolean(uploaded[alt]));
          if (!hasFile) {
            missingDocs.push(spec.label);
          }
        }

        if (missingDocs.length > 0) {
          return res.status(400).json({
            error: 'Please upload all required documents before submitting your application.',
            missingDocuments: missingDocs
          });
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
        const full = data.fullData || {};
        const pd = full.propertyDetails || {};
        const rd = full.residentialAddress || {};

        const constructedAddress = (prop.address && prop.address.trim().length > 1) 
          ? prop.address.trim() 
          : [pd.dno, pd.streetName, pd.village, pd.panchayat, pd.city, pd.taluk, pd.pincode].filter(Boolean).join(', ') ||
            [rd.houseNo, rd.streetName, rd.area, rd.city, rd.taluk, rd.pincode].filter(Boolean).join(', ');

        const constructedVillage = (prop.village && prop.village !== 'Unknown' && prop.village !== 'TBD') 
          ? prop.village 
          : (pd.village || pd.panchayat || rd.area || rd.city || 'TBD');

        const constructedTaluk = (prop.taluk && prop.taluk !== 'Unknown' && prop.taluk !== 'TBD') 
          ? prop.taluk 
          : (pd.taluk || rd.taluk || 'TBD');

        const constructedSurvey = prop.survey_number || pd.surveyNo || 'TBD';

        if (prop && (prop.owner_name || constructedAddress || constructedVillage)) {
          const newProperty = await prisma.property.create({
            data: {
              owner_name: prop.owner_name || data.fullData?.customerName || 'Draft Owner',
              owner_phone: cleanMobile || prop.owner_phone || '9999999999',
              owner_email: cleanEmail || prop.owner_email || null,
              address: constructedAddress || '',
              village: constructedVillage,
              taluk: constructedTaluk,
              survey_number: constructedSurvey,
              plot_area: prop.plot_area || null,
              built_up_area: prop.built_up_area || null,
              floors: prop.floors || null,
              property_type: prop.property_type || null
            }
          });
          property_id = newProperty.id;
        }
      }

      // 7. Staff & Lead Entry Assignment:
      // If a Staff member creates/registers an application, link them to the case so it appears in their dashboard.
      // If Customer self-submits (isCustomer = true), leave unassigned for Admin to assign later.
      const isCustomerSubmission = Boolean(data.isCustomer);
      let assigned_staff_id: string | null = null;
      let creatorStaffName = '';
      let creatorStaffId = '';

      if (userRole.toUpperCase() === 'STAFF' || (req.headers['x-user-name'] && req.headers['x-user-name'] !== 'Admin')) {
        const staffLookup = (req.headers['x-staff-id'] || req.headers['x-user-name'] || data.staff || data.fullData?.staff || '') as string;
        if (staffLookup) {
          let foundStaff = await prisma.user.findFirst({
            where: {
              OR: [
                { id: /^[0-9a-fA-F]{24}$/.test(staffLookup) ? staffLookup : undefined },
                { staffId: { equals: staffLookup, mode: 'insensitive' } },
                { name: { contains: staffLookup, mode: 'insensitive' } }
              ]
            }
          });

          if (!foundStaff && staffLookup && staffLookup.toLowerCase() !== 'admin') {
            try {
              const uName = (req.headers['x-user-name'] as string) || staffLookup;
              const uStaffId = (req.headers['x-staff-id'] as string) || `EMP-${Math.floor(100 + Math.random() * 900)}`;
              const autoPhone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;
              foundStaff = await prisma.user.create({
                data: {
                  name: uName,
                  staffId: uStaffId,
                  phone: autoPhone,
                  email: `${uName.toLowerCase().replace(/[^a-z0-9]/g, '')}@buildingapproval.in`,
                  role: 'STAFF',
                  password_hash: 'default'
                }
              });
            } catch (uErr) {
              console.warn('Could not auto-create staff user:', uErr);
            }
          }

          if (foundStaff) {
            assigned_staff_id = foundStaff.id;
            creatorStaffName = foundStaff.name;
            creatorStaffId = foundStaff.staffId || foundStaff.id;
          }
        }
      } else if (!isCustomerSubmission) {
        if (data.assigned_staff_id) {
          assigned_staff_id = data.assigned_staff_id;
        } else if (data.assigned_staff?.name && data.assigned_staff.name !== 'Unassigned') {
          const staff = await prisma.user.findFirst({
            where: { name: { contains: data.assigned_staff.name, mode: 'insensitive' } }
          });
          if (staff) assigned_staff_id = staff.id;
        }
      }

      const validApprovalTypes = ['LAYOUT_APPROVAL', 'BUILDING_PLAN_APPROVAL', 'COMPLETION_CERTIFICATE', 'PATTA_TRANSFER'];
      let approval_type = data.approval_type;
      if (approval_type === 'BUILDING_PLAN' || approval_type === 'building') {
        approval_type = 'BUILDING_PLAN_APPROVAL';
      } else if (!approval_type || !validApprovalTypes.includes(approval_type)) {
        approval_type = 'BUILDING_PLAN_APPROVAL';
      }

      // Status: New applications appear as "Application Submitted"
      let caseStatus = isDraft ? 'Draft' : 'Application Submitted';
      if (isAdmin && data.status) {
        caseStatus = data.status;
      }

      // Initialize stages
      const initialStages = buildDefaultStages({ status: caseStatus, created_at: new Date() });
      const fullData = {
        ...(data.fullData || {}),
        staff: creatorStaffName || (assigned_staff_id ? (data.fullData?.staff || data.staff || 'Staff') : 'Unassigned'),
        createdByStaff: creatorStaffName || (data.fullData?.createdByStaff || ''),
        createdByStaffId: creatorStaffId || (data.fullData?.createdByStaffId || ''),
        stages: (data.fullData && Array.isArray(data.fullData.stages) && data.fullData.stages.length > 0)
          ? data.fullData.stages
          : initialStages
      };

      const newCase = await prisma.case.create({ 
        data: {
          application_number: String(application_number),
          approval_type: approval_type,
          status: caseStatus,
          property_id: property_id || null,
          assigned_staff_id: assigned_staff_id || null,
          fullData: fullData,
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

      // 8. Create real database notification
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

      // 9. Send Email Confirmation via Brevo with Reference Number & Mobile Number
      if (customerEmail) {
        const origin = req.headers.origin || 'http://localhost:5173';
        notificationService.notifyApplicationSubmitted({
          customerEmail,
          customerName,
          applicationNumber: newCase.application_number as string,
          mobileNumber: cleanMobile,
          propertyAddress: newCase.property?.address || data.fullData?.propertyDetails?.streetName,
          trackUrl: `${origin}/track-application?id=${newCase.application_number}&mobile=${cleanMobile}`
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

      const userRole = (req.headers['x-user-role'] || req.query.role || (req as any).user?.role || '') as string;
      const staffName = (req.headers['x-user-name'] || req.query.staffName || req.query.staff || '') as string;
      const staffId = (req.headers['x-staff-id'] || req.query.staffId || '') as string;

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

      // Worker Isolation: If caller is STAFF, verify they are assigned to this case
      if (userRole.toUpperCase() === 'STAFF') {
        const isAssigned = (staffId && caseData.assigned_staff_id === staffId) ||
          (staffName && caseData.assigned_staff?.name && caseData.assigned_staff.name.toLowerCase() === staffName.toLowerCase()) ||
          (staffName && caseData.assigned_staff?.staffId && caseData.assigned_staff.staffId.toLowerCase() === staffName.toLowerCase()) ||
          (staffName && (caseData.fullData as any)?.staff && String((caseData.fullData as any).staff).toLowerCase() === staffName.toLowerCase());

        if (!isAssigned) {
          return res.status(403).json({ error: 'Forbidden: You are not assigned to view or manage this application.' });
        }
      }

      // Ensure stages exist for stage-wise tracking
      const stages = (caseData.fullData as any)?.stages || buildDefaultStages(caseData);
      const enrichedCaseData = {
        ...caseData,
        fullData: {
          ...((caseData.fullData as any) || {}),
          stages
        }
      };

      res.json(enrichedCaseData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async listCases(req: Request, res: Response) {
    try {
      const { status, jurisdiction, assigned_staff_id } = req.query;
      const userRole = (req.headers['x-user-role'] || req.query.role || (req as any).user?.role || '') as string;
      const staffName = (req.headers['x-user-name'] || req.query.staffName || req.query.staff || '') as string;
      const staffId = (req.headers['x-staff-id'] || assigned_staff_id || '') as string;

      const whereCondition: any = {};
      if (status) whereCondition.status = String(status);

      // Worker Isolation: Workers must only see cases assigned to them!
      let staffUserId = staffId ? String(staffId) : '';
      if (userRole.toUpperCase() === 'STAFF' || (staffName && userRole.toUpperCase() !== 'ADMIN' && staffName !== 'Admin')) {
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
      } else if (assigned_staff_id) {
        whereCondition.assigned_staff_id = String(assigned_staff_id);
      }
      
      const cases = await prisma.case.findMany({
        where: whereCondition,
        include: { property: true, assigned_staff: true, documents: true },
        orderBy: { created_at: 'desc' }
      });

      // Filter in memory to ensure staff only see their own applications under all schema formats
      let finalCases = cases;
      if (userRole.toUpperCase() === 'STAFF') {
        finalCases = cases.filter(c => {
          const full = (c.fullData as any) || {};
          const isStaffAssigned = (staffUserId && c.assigned_staff_id === staffUserId) ||
            (staffName && c.assigned_staff?.name && c.assigned_staff.name.toLowerCase() === staffName.toLowerCase()) ||
            (staffName && c.assigned_staff?.staffId && c.assigned_staff.staffId.toLowerCase() === staffName.toLowerCase()) ||
            (staffName && full.staff && String(full.staff).toLowerCase() === staffName.toLowerCase()) ||
            (staffName && full.createdByStaff && String(full.createdByStaff).toLowerCase() === staffName.toLowerCase()) ||
            (staffId && full.staffId && String(full.staffId).toLowerCase() === staffId.toLowerCase());
          return isStaffAssigned;
        });
      }

      // Enrich stages
      const enrichedCases = finalCases.map(c => ({
        ...c,
        fullData: {
          ...((c.fullData as any) || {}),
          stages: (c.fullData as any)?.stages || buildDefaultStages(c)
        }
      }));

      res.json(enrichedCases);
    } catch (error: any) {
      console.error("Error listing cases:", error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateCase(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const userRole = (req.headers['x-user-role'] || req.query.role || (req as any).user?.role || '') as string;
      const isAdmin = userRole.toUpperCase() === 'ADMIN' || (req as any).user?.role === 'ADMIN';

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

      const existing = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id }, { application_number: id }] }
          : { application_number: id },
        include: { property: true, assigned_staff: true }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Case not found' });
      }

      // 1. Security & Permissions Check:
      // Check if caller is editing customer personal details
      const isEditingCustomerDetails = Boolean(
        data.customerName !== undefined ||
        data.customerDetails !== undefined ||
        data.property !== undefined ||
        (data.fullData && (
          data.fullData.customerName !== undefined ||
          data.fullData.mobile !== undefined ||
          data.fullData.email !== undefined ||
          data.fullData.residentialAddress !== undefined ||
          data.fullData.permanentAddress !== undefined ||
          data.fullData.fatherName !== undefined ||
          data.fullData.dob !== undefined ||
          data.fullData.aadhar !== undefined ||
          data.fullData.pan !== undefined
        ))
      );

      if (isEditingCustomerDetails && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin has permission to edit customer application details.' });
      }

      // Check if caller is changing worker assignment
      const isAssigningWorker = Boolean(
        data.assigned_staff_id !== undefined ||
        data.staff !== undefined ||
        data.assignedStaff !== undefined
      );

      if (isAssigningWorker && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin can assign or change worker assignments.' });
      }

      // 2. Validate PIN code if address/property is being updated
      const resPincode = data.fullData?.residentialAddress?.pincode;
      const permPincode = data.fullData?.permanentAddress?.pincode;
      const propPincode = data.fullData?.propertyDetails?.pincode || data.property?.pincode;

      if (resPincode && !/^\d{6}$/.test(String(resPincode).trim())) {
        return res.status(400).json({ error: 'Residential PIN code must be exactly 6 digits (numbers only).' });
      }
      if (permPincode && !/^\d{6}$/.test(String(permPincode).trim())) {
        return res.status(400).json({ error: 'Permanent address PIN code must be exactly 6 digits (numbers only).' });
      }
      if (propPincode && !/^\d{6}$/.test(String(propPincode).trim())) {
        return res.status(400).json({ error: 'Property PIN code must be exactly 6 digits (numbers only).' });
      }

      // 3. Validate Mobile Number if being updated
      const rawMobile = data.fullData?.mobile || data.property?.owner_phone;
      if (rawMobile) {
        const cleanMobile = String(rawMobile).trim().replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
          return res.status(400).json({ error: 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
        }
      }

      // 4. Validate Email if being updated
      const rawEmail = data.fullData?.email || data.property?.owner_email;
      if (rawEmail) {
        const cleanEmail = String(rawEmail).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
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
      if (data.uploadedFiles !== undefined) updatePayload.uploadedFiles = data.uploadedFiles;
      if (data.linkTracking !== undefined) updatePayload.linkTracking = data.linkTracking;
      if (data.reason !== undefined) updatePayload.reason = data.reason;

      // Handle Worker Assignment / Reassignment
      let staffAssignedChanged = false;
      let newlyAssignedStaffUser: any = null;
      let targetStaffName = data.staff !== undefined ? data.staff : (data.assignedStaff !== undefined ? data.assignedStaff : data.assigned_staff?.name);

      if (data.assigned_staff_id !== undefined) {
        updatePayload.assigned_staff_id = data.assigned_staff_id || null;
        if (data.assigned_staff_id && data.assigned_staff_id !== existing.assigned_staff_id) {
          staffAssignedChanged = true;
          newlyAssignedStaffUser = await prisma.user.findUnique({ where: { id: data.assigned_staff_id } });
        }
      } else if (targetStaffName !== undefined) {
        if (!targetStaffName || targetStaffName === 'Unassigned' || targetStaffName === 'None') {
          updatePayload.assigned_staff_id = null;
          if (existing.assigned_staff_id) staffAssignedChanged = true;
        } else {
          newlyAssignedStaffUser = await prisma.user.findFirst({
            where: {
              OR: [
                { name: { equals: String(targetStaffName), mode: 'insensitive' } },
                { staffId: { equals: String(targetStaffName), mode: 'insensitive' } },
                { email: { equals: String(targetStaffName), mode: 'insensitive' } },
                ...( /^[0-9a-fA-F]{24}$/.test(String(targetStaffName)) ? [{ id: String(targetStaffName) }] : [])
              ]
            }
          });
          if (newlyAssignedStaffUser) {
            updatePayload.assigned_staff_id = newlyAssignedStaffUser.id;
            targetStaffName = newlyAssignedStaffUser.name;
            if (newlyAssignedStaffUser.id !== existing.assigned_staff_id) {
              staffAssignedChanged = true;
            }
          }
        }
      }

      // Preserve existing stages and document verification status when updating fullData
      const existingFullData = (existing.fullData as any) || {};
      const newFullData = data.fullData || {};

      updatePayload.fullData = {
        ...existingFullData,
        ...newFullData,
        stages: newFullData.stages || existingFullData.stages || buildDefaultStages(existing),
        documentVerification: newFullData.documentVerification || existingFullData.documentVerification || {},
        requestedReuploads: newFullData.requestedReuploads || existingFullData.requestedReuploads || [],
        completionEmailSent: newFullData.completionEmailSent !== undefined ? newFullData.completionEmailSent : existingFullData.completionEmailSent,
        ...(targetStaffName !== undefined ? { staff: targetStaffName } : {})
      };

      const updated = await prisma.case.update({
        where: { id: existing.id },
        data: updatePayload,
        include: { property: true, assigned_staff: true, documents: true }
      });

      // Send Worker Assignment Notification & Email
      if (staffAssignedChanged && newlyAssignedStaffUser) {
        try {
          const appIdentifier = updated.application_number || updated.id;
          await prisma.notification.create({
            data: {
              title: `Worker Assigned: ${appIdentifier}`,
              message: `Application ${appIdentifier} assigned to ${newlyAssignedStaffUser.name} (${newlyAssignedStaffUser.staffId || 'Staff'}).`,
              type: 'case_assigned',
              case_id: appIdentifier
            }
          });

          if (newlyAssignedStaffUser.email) {
            const origin = req.headers.origin || 'http://localhost:5173';
            notificationService.notifyCaseAssignedToStaff({
              staffEmail: newlyAssignedStaffUser.email,
              staffName: newlyAssignedStaffUser.name,
              applicationNumber: appIdentifier,
              customerName: updated.property?.owner_name || (updated.fullData as any)?.customerName || 'Valued Applicant',
              mobileNumber: updated.property?.owner_phone || (updated.fullData as any)?.mobile || '',
              propertyAddress: updated.property?.address || (updated.fullData as any)?.propertyDetails?.streetName || '',
              portalUrl: `${origin}/employee/applications`
            }).catch(err => {
              console.error("Failed to send staff assignment email:", err);
            });
          }
        } catch (assignErr) {
          console.error("Error creating assignment notification:", assignErr);
        }
      }

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

  async updateStage(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { stageKey, stageIndex: rawIndex, status, remarks, completedDate, responsiblePerson } = req.body;
      const userRole = (req.headers['x-user-role'] || req.query.role || (req as any).user?.role || '') as string;
      const isAdmin = userRole.toUpperCase() === 'ADMIN' || (req as any).user?.role === 'ADMIN';

      if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin has permission to update application stages.' });
      }

      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      const found = await prisma.case.findFirst({
        where: isObjectId
          ? { OR: [{ id }, { application_number: id }] }
          : { application_number: id },
        include: { property: true, assigned_staff: true, documents: true }
      });

      if (!found) return res.status(404).json({ error: 'Case not found' });

      // Load or initialize stages
      let stages: any[] = (found.fullData as any)?.stages || [];
      if (!Array.isArray(stages) || stages.length === 0) {
        stages = buildDefaultStages(found);
      }

      let stageIndex = -1;
      if (typeof rawIndex === 'number' && rawIndex >= 0 && rawIndex < stages.length) {
        stageIndex = rawIndex;
      } else if (stageKey) {
        stageIndex = stages.findIndex((s: any) => s.key === stageKey || s.name === stageKey);
      }

      if (stageIndex === -1) {
        return res.status(400).json({ error: `Stage ${rawIndex !== undefined ? rawIndex : stageKey} not recognized.` });
      }

      // Check validation rules:
      // Rule 1: Cannot complete "Document Verification" before all required documents are verified
      if (stages[stageIndex].key === 'stage_doc_verification' && status === 'Completed') {
        const docVerification = (found.fullData as any)?.documentVerification || {};
        const requiredDocKeys = ['CUSTOMER PHOTOGRAPH', 'CUSTOMER SIGNATURE', 'AADHAR CARD', 'PAN CARD', 'SALE DEED', 'PATTA', 'BUILDING PLAN'];
        
        const unverified = requiredDocKeys.filter(k => {
          const v = docVerification[k];
          return !v || v.status !== 'Verified';
        });

        if (unverified.length > 0) {
          return res.status(400).json({ 
            error: 'Document Verification stage cannot be completed until all required documents are verified.',
            unverifiedDocuments: unverified
          });
        }
      }

      // Rule 2: Cannot mark "Application Completed" before prior stages (0 to 4) are completed
      if (stages[stageIndex].key === 'stage_completed' && (status === 'Completed' || status === 'In Progress')) {
        const incompletePrior = stages.slice(0, 5).filter(s => s.status !== 'Completed');
        if (incompletePrior.length > 0) {
          return res.status(400).json({ 
            error: 'Application cannot be marked Completed before all prior stages are completed.',
            incompleteStages: incompletePrior.map(s => s.name)
          });
        }
      }

      // Update current stage
      stages[stageIndex].status = status; // 'Completed' | 'In Progress' | 'Pending'
      if (remarks !== undefined) stages[stageIndex].remarks = remarks;
      if (responsiblePerson !== undefined) stages[stageIndex].responsiblePerson = responsiblePerson;
      if (status === 'Completed') {
        stages[stageIndex].completedDate = completedDate || new Date().toISOString();
        if (stageIndex + 1 < stages.length && stages[stageIndex + 1].status === 'Pending') {
          stages[stageIndex + 1].status = 'In Progress';
          stages[stageIndex + 1].startedDate = new Date().toISOString();
        }
      } else if (status === 'In Progress' && !stages[stageIndex].startedDate) {
        stages[stageIndex].startedDate = new Date().toISOString();
      }

      // Determine updated overall Current Status
      let overallStatus = stages[stageIndex].name;
      const activeStage = stages.find(s => s.status === 'In Progress') || (stages.every(s => s.status === 'Completed') ? stages[stages.length - 1] : stages[0]);
      overallStatus = activeStage.name;

      const previousStatus = found.status;
      const fullData = {
        ...((found.fullData as any) || {}),
        stages
      };

      let completionEmailSent = (found.fullData as any)?.completionEmailSent || false;

      // If moving to Application Completed and not already sent, trigger completion email!
      if (overallStatus === 'Application Completed' && !completionEmailSent) {
        const customerEmail = found.property?.owner_email || (found.fullData as any)?.email;
        const customerName = found.property?.owner_name || (found.fullData as any)?.customerName || 'Valued Applicant';
        const proposalNo = found.application_number || found.id;
        const product = found.approval_type || (found.fullData as any)?.serviceType || 'Building Approval';
        const origin = req.headers.origin || 'http://localhost:5173';
        const trackUrl = `${origin}/track-application?id=${proposalNo}&mobile=${found.property?.owner_phone || (found.fullData as any)?.mobile || ''}`;

        if (customerEmail) {
          notificationService.notifyApplicationCompleted({
            customerEmail,
            customerName,
            applicationNumber: proposalNo,
            product,
            trackUrl
          }).then(() => {
            console.log(`Application completion email sent successfully to ${customerEmail}`);
          }).catch(err => {
            console.error('Failed to send application completion email:', err);
          });
        }
        fullData.completionEmailSent = true;
      }

      const updated = await prisma.case.update({
        where: { id: found.id },
        data: {
          status: overallStatus,
          fullData
        },
        include: { property: true, assigned_staff: true, documents: true }
      });

      // Record in status history
      const adminName = (req.headers['x-user-name'] as string) || 'Admin';
      try {
        await prisma.statusHistory.create({
          data: {
            case_id: found.id,
            from_status: previousStatus || 'Application Submitted',
            to_status: overallStatus,
            note: remarks ? `Stage "${stages[stageIndex].name}" updated by ${adminName}: ${remarks}` : `Stage "${stages[stageIndex].name}" updated to ${status} by ${adminName}`
          }
        });
      } catch (hErr) {
        console.warn('Status history recording skipped:', hErr);
      }

      // Record in notification
      try {
        await prisma.notification.create({
          data: {
            title: `Stage Updated: ${updated.application_number}`,
            message: `Stage "${stages[stageIndex].name}" updated to "${status}" by Admin.`,
            type: 'case_stage_update',
            case_id: updated.application_number
          }
        });
      } catch (nErr) {
        console.warn('Notification creation skipped:', nErr);
      }

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating stage:', error);
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
