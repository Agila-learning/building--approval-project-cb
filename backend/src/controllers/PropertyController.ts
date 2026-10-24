import { Request, Response } from 'express';
import prisma from '../prisma';

export class PropertyController {
  async createProperty(req: Request, res: Response) {
    try {
      const data = req.body;
      const validJurisdictions = ['DTCP', 'TOWN_PANCHAYAT', 'PANCHAYAT_UNION'];
      const sanitizedData = {
        owner_name: data.owner_name || 'Draft Owner',
        owner_phone: data.owner_phone || '0000000000',
        owner_email: data.owner_email || null,
        address: data.address || data.village || data.location || 'Hosur',
        village: data.village || 'Unknown',
        taluk: data.taluk || 'Hosur',
        survey_number: data.survey_number || 'TBD',
        jurisdiction: validJurisdictions.includes(data.jurisdiction) ? data.jurisdiction : 'DTCP',
        plot_area: data.plot_area ? String(data.plot_area) : null,
        built_up_area: data.built_up_area ? String(data.built_up_area) : null,
        floors: data.floors ? String(data.floors) : null,
        property_type: data.property_type || null
      };
      const property = await prisma.property.create({ data: sanitizedData });
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      res.status(400).json({ error: error.message });
    }
  }

  async getProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await prisma.property.findUnique({
        where: { id: id as string },
        include: { cases: true },
      });
      if (!property) return res.status(404).json({ error: 'Not found' });
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async listProperties(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const properties = await prisma.property.findMany({
        where: search
          ? {
              OR: [
                { owner_name: { contains: String(search), mode: 'insensitive' } },
                { owner_phone: { contains: String(search) } },
                { survey_number: { contains: String(search) } },
              ],
            }
          : undefined,
      });
      res.json(properties);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const propertyController = new PropertyController();
