export type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT_READONLY';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  username?: string;
  phone?: string;
  email?: string | null;
  role: UserRole;
  status?: string;
  staffId?: string | null;
}

export interface Property {
  id?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string | null;
  address?: string;
  village?: string;
  taluk?: string;
  district?: string;
  survey_number?: string;
  jurisdiction?: string | null;
  plot_area?: string | null;
  plotArea?: string | number;
  built_up_area?: string | null;
  floors?: string | null;
  property_type?: string | null;
  buildingType?: string;
}

export interface DocumentItem {
  id?: string;
  name?: string;
  url: string;
  type?: string;
  uploadedAt?: string;
}

export interface Case {
  id: string;
  _id?: string;
  applicationNumber?: string;
  application_number?: string;
  clientName?: string;
  approval_type?: string;
  approval_number?: string;
  status: string;
  property_id?: string;
  property?: Property;
  propertyDetails?: Property;
  assigned_staff_id?: string;
  assigned_staff?: { name: string; id?: string };
  assignedTo?: string;
  documents?: DocumentItem[];
  fees?: {
    total?: number;
    paid?: number;
    pending?: number;
    notes?: string;
    charges?: Array<{ id: string; description: string; amount: number; date: string }>;
  };
  fullData?: any;
  uploadedFiles?: Record<string, string>;
  linkTracking?: {
    sent?: boolean;
    sendStatus?: string;
    sentDate?: string;
    customerUploaded?: boolean;
    uploadDate?: string;
    requestedReuploads?: string[];
  };
  reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  _id?: string;
  leadId?: string;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  location?: string;
  projectType?: string;
  status: string;
  type?: string;
  assignedTo?: string;
  notes?: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id?: string;
  _id?: string;
  staffName?: string;
  userName?: string;
  userId?: string;
  date: string;
  checkIn?: string;
  checkInTime?: string;
  checkOut?: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'PRESENT' | 'HALF_DAY' | 'LEAVE';
}
