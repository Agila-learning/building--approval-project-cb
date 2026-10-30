import { Request, Response } from 'express';
import prisma from '../prisma';
import { BrevoNotificationService } from '../services/BrevoNotificationService';

const notificationService = new BrevoNotificationService();

export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, location, type = 'Enquiry', projectType, propertyDetails, notes, aadharFile, aadharFileName, buildingPhoto, buildingPhotoName } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
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
        name,
        phone,
        email,
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
    const leads = await prisma.lead.findMany({
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
    
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData
    });
    
    res.status(200).json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};
