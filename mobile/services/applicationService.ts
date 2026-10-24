import { apiRequest } from './api';
import { Case, Lead, User, AttendanceRecord } from '../types';

export const applicationService = {
  // Primary REST methods
  async getAll(): Promise<{ data?: Case[]; error?: string }> {
    const res = await apiRequest<Case[]>('/cases');
    return { data: res.data, error: res.error };
  },

  async getById(id: string): Promise<{ data?: Case; error?: string }> {
    const res = await apiRequest<Case>(`/cases/${id}`);
    return { data: res.data, error: res.error };
  },

  async create(payload: Partial<Case>): Promise<{ data?: Case; error?: string }> {
    const res = await apiRequest<Case>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { data: res.data, error: res.error };
  },

  async update(id: string, payload: Partial<Case>): Promise<{ data?: Case; error?: string }> {
    const res = await apiRequest<Case>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { data: res.data, error: res.error };
  },

  async updateStatus(id: string, status: string, note?: string): Promise<{ data?: Case; error?: string }> {
    const res = await apiRequest<Case>(`/cases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    return { data: res.data, error: res.error };
  },

  async delete(id: string): Promise<{ error?: string }> {
    const res = await apiRequest(`/cases/${id}`, {
      method: 'DELETE',
    });
    return { error: res.error };
  },

  // Direct return helpers
  async getCases(): Promise<Case[]> {
    const res = await apiRequest<Case[]>('/cases');
    const cases = res.data || [];
    return cases.map((c) => {
      const prop: any = c.property || {};
      return {
        ...c,
        applicationNumber: c.applicationNumber || c.application_number || `CBA-${c.id?.slice(-4)}`,
        clientName: c.clientName || prop.owner_name || (c as any).client_name || 'Client',
        propertyDetails: c.propertyDetails || {
          address: prop.address,
          buildingType: prop.property_type,
          plotArea: prop.plot_area,
        },
      };
    });
  },

  async getCaseById(id: string): Promise<Case | null> {
    const res = await apiRequest<Case>(`/cases/${id}`);
    if (!res.data) return null;
    const c = res.data;
    const prop: any = c.property || {};
    return {
      ...c,
      applicationNumber: c.applicationNumber || c.application_number || `CBA-${c.id?.slice(-4)}`,
      clientName: c.clientName || prop.owner_name || (c as any).client_name || 'Client',
      propertyDetails: c.propertyDetails || {
        address: prop.address,
        buildingType: prop.property_type,
        plotArea: prop.plot_area,
      },
    };
  },

  async updateCase(id: string, payload: Partial<Case>): Promise<Case | null> {
    const res = await apiRequest<Case>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data || null;
  },

  async getLeads(): Promise<Lead[]> {
    const res = await apiRequest<Lead[]>('/leads');
    return res.data || [];
  },

  async getUsers(): Promise<User[]> {
    const res = await apiRequest<User[]>('/users');
    return res.data || [];
  },

  async createUser(payload: any): Promise<User | null> {
    const res = await apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data || null;
  },

  async getAttendance(): Promise<AttendanceRecord[]> {
    const res = await apiRequest<AttendanceRecord[]>('/attendance');
    return res.data || [];
  },

  async markAttendance(payload: any): Promise<any> {
    const res = await apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};

export const leadService = {
  async getAll(): Promise<{ data?: Lead[]; error?: string }> {
    const res = await apiRequest<Lead[]>('/leads');
    return { data: res.data, error: res.error };
  },

  async create(payload: Partial<Lead>): Promise<{ data?: Lead; error?: string }> {
    const res = await apiRequest<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { data: res.data, error: res.error };
  },

  async updateStatus(id: string, status: string): Promise<{ data?: Lead; error?: string }> {
    const res = await apiRequest<Lead>(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return { data: res.data, error: res.error };
  },
};

export const userService = {
  async getAll(): Promise<{ data?: User[]; error?: string }> {
    const res = await apiRequest<User[]>('/users');
    return { data: res.data, error: res.error };
  },

  async create(payload: any): Promise<{ data?: User; error?: string }> {
    const res = await apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { data: res.data, error: res.error };
  },

  async update(id: string, payload: any): Promise<{ data?: User; error?: string }> {
    const res = await apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { data: res.data, error: res.error };
  },

  async delete(id: string): Promise<{ error?: string }> {
    const res = await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
    return { error: res.error };
  },
};
