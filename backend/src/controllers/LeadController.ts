import { Request, Response } from 'express';
import prisma from '../prisma';
import { BrevoNotificationService } from '../services/BrevoNotificationService';

const notificationService = new BrevoNotificationService();

export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, phone, altPhone, altMobile, aadhar, aadharNumber, pan, panNumber, email, location, type = 'Enquiry', projectType, propertyDetails, notes, aadharFile, aadharFileName, buildingPhoto, buildingPhotoName } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
    }

    const rawAlt = altMobile || altPhone;
    if (rawAlt) {
      const cleanAlt = String(rawAlt).trim().replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
        return res.status(400).json({ error: 'Alternate mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.' });
      }
      if (cleanPhone === cleanAlt) {
        return res.status(400).json({ error: 'Mobile number and alternate mobile number cannot be the same.' });
      }
    }

    const rawAadhar = aadhar || aadharNumber;
    if (rawAadhar) {
      const cleanAadhar = String(rawAadhar).trim().replace(/\D/g, '');
      if (cleanAadhar.length !== 12) {
        return res.status(400).json({ error: 'Aadhar number must be exactly 12 digits.' });
      }
    }

    const rawPan = pan || panNumber;
    if (rawPan) {
      const cleanPan = String(rawPan).trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        return res.status(400).json({ error: 'PAN number must be 10 characters in the format ABCDE1234F.' });
      }
    }

    // Duplicate check: Prevent duplicate registration with same mobile number
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { phone: `91${cleanPhone}` }
        ]
      }
    });

    if (existingLead) {
      return res.status(409).json({
        error: 'A registration with this mobile number already exists. If the customer wishes to register for a second/different building, please enter a different mobile number.'
      });
    }

    const existingCase = await prisma.case.findFirst({
      where: {
        property: {
          owner_phone: { in: [cleanPhone, `+91${cleanPhone}`, `91${cleanPhone}`] }
        }
      }
    });

    if (existingCase) {
      return res.status(409).json({
        error: 'An active application with this mobile number already exists. If the customer wishes to register for another building, please provide a different mobile number.'
      });
    }

    // Generate leadId based on type
    const count = await prisma.lead.count({ where: { type } });
    const prefix = type === 'Lead' ? 'LD' : 'EQ';
    const formattedCount = String(count + 1).padStart(3, '0');
    const leadId = `${prefix}-${formattedCount}`;

    const newLead = await prisma.lead.create({
      data: {
        leadId,
        type,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim().toLowerCase() : null,
        location,
        projectType: projectType || 'General Enquiry',
        propertyDetails: propertyDetails || 'General Enquiry via Popup',
        aadharFile,
        aadharFileName,
        buildingPhoto,
        buildingPhotoName,
        notes,
        status: 'New'
      }
    });

    if (email) {
      // Send thank you email asynchronously
      notificationService.notifyLeadThanks(email, name).catch(err => {
        console.error('Failed to send thank you email for lead:', err);
      });
    }

    try {
      await prisma.notification.create({
        data: {
          title: `New ${type}: ${name}`,
          message: `${name} submitted a new ${type.toLowerCase()} (${newLead.leadId}) from ${location || 'online'}. Phone: ${phone}.`,
          type: type === 'Lead' ? 'lead_created' : 'enquiry_created',
          case_id: newLead.leadId
        }
      });
    } catch (notifErr) {
      console.error('Failed to create notification for lead:', notifErr);
    }

    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const userRole = (req.headers['x-user-role'] || req.query.role || (req as any).user?.role || '') as string;
    const staffName = (req.headers['x-user-name'] || req.query.staffName || req.query.staff || '') as string;
    const assignedToQuery = req.query.assignedTo as string;

    const whereCondition: any = {};

    // Worker isolation: Workers see only leads assigned directly to them!
    if (userRole.toUpperCase() === 'STAFF' || (staffName && userRole.toUpperCase() !== 'ADMIN' && staffName !== 'Admin')) {
      if (!staffName && !assignedToQuery) {
        return res.status(200).json([]);
      }
      whereCondition.assignedTo = assignedToQuery || staffName;
    } else if (assignedToQuery) {
      whereCondition.assignedTo = assignedToQuery;
    }

    const leads = await prisma.lead.findMany({
      where: whereCondition,
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, assignedTo } = req.body;
    
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData
    });

    if (assignedTo !== undefined && assignedTo !== existing.assignedTo) {
      try {
        await prisma.notification.create({
          data: {
            title: `Lead Assigned: ${lead.name}`,
            message: `Lead ${lead.leadId || lead.name} has been assigned to ${assignedTo || 'Unassigned'}.`,
            type: 'lead_assigned',
            case_id: lead.leadId || lead.id
          }
        });
      } catch (nErr) {
        console.error("Failed to create lead assignment notification:", nErr);
      }
    }
    
    res.status(200).json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};
