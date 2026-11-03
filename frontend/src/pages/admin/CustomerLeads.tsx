import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, FileText, X, Pencil, Info, ArrowUpDown, Plus, UserCheck, Eye, 
  Download, Trash2, Phone, MessageCircle, MapPin, Building, Calendar, 
  Clock, CheckCircle2, AlertCircle, RefreshCw, User, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const downloadLeadFile = async (url: string, filename: string) => {
  try {
    const toastId = toast.loading(`Downloading ${filename}...`);
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.dismiss(toastId);
    toast.success('Downloaded successfully!');
  } catch (e) {
    window.open(url, '_blank');
  }
};

const CustomerLeads: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingLead, setViewingLead] = useState<any | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [projectTypeFilter, setProjectTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStaff = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users`);
      if (res.ok) {
        const uList = await res.json();
        setStaffMembers(uList.filter((u: any) => u.status === 'Active' && u.role === 'STAFF'));
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    }
  };

  const computeDaysElapsed = (rawDate: any, status?: string, updatedDate?: any) => {
    if (!rawDate) return 0;
    const start = new Date(rawDate).getTime();
    if (isNaN(start)) return 0;
    const isCompleted = ['Rejected', 'Approved', 'Application Created', 'Converted'].includes(status || '');
    const end = isCompleted && updatedDate && !isNaN(new Date(updatedDate).getTime()) ? new Date(updatedDate).getTime() : Date.now();
    const diffDays = Math.floor(Math.max(0, end - start) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const leadsRes = await fetch(`${apiUrl}/leads`);

      let combinedLeads: any[] = [];

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        const formattedLeads = data
          .filter((lead: any) => lead.type === 'Lead' || lead.type === 'Enquiry' || !lead.type)
          .map((lead: any) => {
            const leadDateRaw = lead.created_at || lead.createdAt;
            const leadDateDisplay = leadDateRaw && !isNaN(new Date(leadDateRaw).getTime())
              ? new Date(leadDateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—';
            const days = computeDaysElapsed(leadDateRaw, lead.status, lead.updated_at || lead.updatedAt);

            return {
              id: lead.id,
              displayId: lead.leadId || lead.id,
              name: lead.name || 'Prospective Client',
              phone: lead.phone || '',
              email: lead.email || '',
              location: lead.location || '',
              projectType: lead.projectType || 'General Enquiry',
              propertyDetails: lead.propertyDetails || 'General Enquiry via Popup',
              date: leadDateDisplay,
              rawDate: leadDateRaw,
              days,
              status: lead.status || 'New',
              assignedTo: lead.assignedTo || '',
              aadharFile: lead.aadharFile,
              aadharFileName: lead.aadharFileName,
              buildingPhoto: lead.buildingPhoto,
              buildingPhotoName: lead.buildingPhotoName,
              uploadedFiles: lead.uploadedFiles || {},
              isCase: false
            };
          });
        combinedLeads = [...formattedLeads];
      }

      // Add local leads if any
      const saved = localStorage.getItem('mock_saved_cases');
      if (saved) {
        const localLeads = JSON.parse(saved)
          .filter((c: any) => c.type === 'Lead')
          .map((c: any) => {
            const full = c.fullData || {};
            const prop = c.property || {};
            const leadDateRaw = c.created_at || c.createdAt || c.date;
            const leadDateDisplay = leadDateRaw && !isNaN(new Date(leadDateRaw).getTime())
              ? new Date(leadDateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—';
            const days = computeDaysElapsed(leadDateRaw, c.status, c.updated_at || c.updatedAt);

            return {
              id: c.id,
              displayId: c.application_number || c.id,
              name: prop.owner_name || full.customerName || c.applicantName || 'Prospective Client',
              phone: prop.owner_phone || full.mobile || '',
              email: prop.owner_email || full.email || '',
              location: prop.city || full.propertyDetails?.city || prop.jurisdiction || '',
              projectType: c.approval_type || full.serviceType || 'Residential Building',
              propertyDetails: full.propertyDetails?.address || prop.address || 'Lead created via portal',
              date: leadDateDisplay,
              rawDate: leadDateRaw,
              days,
              status: c.status || 'New',
              assignedTo: c.assigned_staff?.name || full.staff || '',
              aadharFile: null,
              aadharFileName: null,
              buildingPhoto: null,
              buildingPhotoName: null,
              uploadedFiles: c.uploadedFiles || {},
              isCase: true
            };
          });

        localLeads.forEach((ll: any) => {
          if (!combinedLeads.some(cl => cl.id === ll.id || cl.displayId === ll.displayId)) {
            combinedLeads.push(ll);
          }
        });
      }

      // Sort by newest
      combinedLeads.sort((a, b) => {
        const tA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const tB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return tB - tA;
      });

      setLeads(combinedLeads);
    } catch (e) {
      console.error("Failed to load customer leads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    loadLeads();
    const interval = setInterval(loadLeads, 15000);
    window.addEventListener('storage', loadLeads);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadLeads);
    };
  }, []);

  const handleAssignWorker = async (leadId: string, staffName: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedTo: staffName } : l));
    if (viewingLead && viewingLead.id === leadId) {
      setViewingLead((prev: any) => ({ ...prev, assignedTo: staffName }));
    }
    try {
      const apiUrl = getApiUrl();
      const currentLead = leads.find(l => l.id === leadId);
      if (currentLead?.isCase) {
        const staffObj = staffMembers.find(s => s.name === staffName);
        await fetch(`${apiUrl}/cases/${leadId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': 'ADMIN',
            'x-user-name': 'Admin'
          },
          body: JSON.stringify({ 
            staff: staffName || 'Unassigned',
            assigned_staff_id: staffObj ? staffObj.id : null
          })
        });
      } else {
        await fetch(`${apiUrl}/leads/${leadId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: currentLead?.status || 'New',
            assignedTo: staffName 
          })
        });
      }
      toast.success(staffName ? `Assigned to ${staffName}` : 'Lead unassigned');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update assignment');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    if (viewingLead && viewingLead.id === leadId) {
      setViewingLead((prev: any) => ({ ...prev, status: newStatus }));
    }
    try {
      const apiUrl = getApiUrl();
      const currentLead = leads.find(l => l.id === leadId);
      if (currentLead?.isCase) {
        await fetch(`${apiUrl}/cases/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
          body: JSON.stringify({ status: newStatus })
        });
      } else {
        await fetch(`${apiUrl}/leads/${leadId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: newStatus,
            assignedTo: currentLead?.assignedTo || '' 
          })
        });
      }
      toast.success(`Lead status updated to ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteLead = async (lead: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete lead ${lead.displayId} (${lead.name})?`)) return;
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/leads/${lead.id}`, { method: 'DELETE' });
      const localLeadsStr = localStorage.getItem('mock_leads');
      if (localLeadsStr) {
        const localLeads = JSON.parse(localLeadsStr).filter((l: any) => l.id !== lead.id && l.leadId !== lead.displayId);
        localStorage.setItem('mock_leads', JSON.stringify(localLeads));
      }
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      if (viewingLead?.id === lead.id) setViewingLead(null);
      toast.success(`Lead ${lead.displayId} deleted.`);
    } catch (err) {
      toast.error('Failed to delete lead.');
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => (l.status || '').toUpperCase() === 'NEW' || !l.assignedTo).length;
    const contacted = leads.filter(l => (l.status || '').toUpperCase() === 'CONTACTED').length;
    const converted = leads.filter(l => ['APPLICATION CREATED', 'CONVERTED', 'APPROVED'].includes((l.status || '').toUpperCase())).length;
    return { total, newLeads, contacted, converted };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const s = (lead.status || '').toUpperCase();
        if (statusFilter === 'NEW' && s !== 'NEW') return false;
        if (statusFilter === 'CONTACTED' && s !== 'CONTACTED') return false;
        if (statusFilter === 'CONVERTED' && !['APPLICATION CREATED', 'CONVERTED', 'APPROVED'].includes(s)) return false;
        if (statusFilter === 'REJECTED' && s !== 'REJECTED') return false;
      }

      // Staff filter
      if (staffFilter !== 'ALL') {
        if (staffFilter === 'UNASSIGNED') {
          if (lead.assignedTo && lead.assignedTo.trim() !== '') return false;
        } else {
          if ((lead.assignedTo || '').toLowerCase() !== staffFilter.toLowerCase()) return false;
        }
      }

      // Project type filter
      if (projectTypeFilter !== 'ALL') {
        if ((lead.projectType || '').toLowerCase() !== projectTypeFilter.toLowerCase()) return false;
      }

      // Search keyword filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const words = q.split(/\s+/).filter(Boolean);
        const name = String(lead.name || '').toLowerCase();
        const phone = String(lead.phone || '').toLowerCase();
        const displayId = String(lead.displayId || '').toLowerCase();
        const loc = String(lead.location || '').toLowerCase();
        const pType = String(lead.projectType || '').toLowerCase();
        const staff = String(lead.assignedTo || '').toLowerCase();

        const matches = words.every(w => 
          name.includes(w) || phone.includes(w) || displayId.includes(w) || 
          loc.includes(w) || pType.includes(w) || staff.includes(w)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [leads, statusFilter, staffFilter, projectTypeFilter, searchTerm]);

  const resetFilters = () => {
    setStatusFilter('ALL');
    setStaffFilter('ALL');
    setProjectTypeFilter('ALL');
    setSearchTerm('');
  };

  const hasActiveFilters = statusFilter !== 'ALL' || staffFilter !== 'ALL' || projectTypeFilter !== 'ALL' || searchTerm.trim() !== '';

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'NEW') {
      return { bg: '#fee2e2', color: '#dc2626', label: 'New Lead' };
    }
    if (s === 'CONTACTED') {
      return { bg: '#e0f2fe', color: '#0369a1', label: 'Contacted' };
    }
    if (s === 'APPLICATION CREATED' || s === 'CONVERTED') {
      return { bg: '#dcfce7', color: '#166534', label: 'Converted' };
    }
    if (s === 'REJECTED') {
      return { bg: '#f1f5f9', color: '#64748b', label: 'Dropped / Rejected' };
    }
    return { bg: '#fef3c7', color: '#b45309', label: status || 'In Progress' };
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--primary)" /> Customer Leads & Inquiries
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Manage incoming prospective clients, assign executives, follow up, and convert into official building approval applications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadLeads}
            title="Refresh Leads"
            style={{
              padding: '0.55rem 0.95rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '0.5rem' }} 
            onClick={() => navigate('/admin/leads/new')}
          >
            <Plus size={18} /> New Lead
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.875rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{metrics.total}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>Total Inquiries Received</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.875rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid #fee2e2',
          boxShadow: '0 2px 4px rgba(220,38,38,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>{metrics.newLeads}</div>
            <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600, marginTop: '0.2rem' }}>New / Unassigned Leads</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.875rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid #e0f2fe',
          boxShadow: '0 2px 4px rgba(3,105,161,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1', lineHeight: 1.1 }}>{metrics.contacted}</div>
            <div style={{ fontSize: '0.8rem', color: '#075985', fontWeight: 600, marginTop: '0.2rem' }}>In Follow-Up / Contacted</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.875rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid #dcfce7',
          boxShadow: '0 2px 4px rgba(22,101,52,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', lineHeight: 1.1 }}>{metrics.converted}</div>
            <div style={{ fontSize: '0.8rem', color: '#14532d', fontWeight: 600, marginTop: '0.2rem' }}>Converted to Applications</div>
          </div>
        </div>
      </div>

      {/* Main Filter & Action Card */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '0.875rem', 
        border: '1px solid #e2e8f0', 
        padding: '1.25rem', 
        marginBottom: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          
          {/* Status Quick Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Leads', count: leads.length },
              { id: 'NEW', label: 'New Leads', count: metrics.newLeads },
              { id: 'CONTACTED', label: 'Contacted', count: metrics.contacted },
              { id: 'CONVERTED', label: 'Converted', count: metrics.converted },
              { id: 'REJECTED', label: 'Dropped', count: leads.filter(l => (l.status || '').toUpperCase() === 'REJECTED').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '2rem',
                  border: statusFilter === tab.id ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                  backgroundColor: statusFilter === tab.id ? 'var(--primary)' : '#f8fafc',
                  color: statusFilter === tab.id ? '#ffffff' : '#475569',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '1rem',
                  backgroundColor: statusFilter === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: statusFilter === tab.id ? '#ffffff' : '#334155',
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search name, phone, lead ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem 2rem 0.5rem 2.25rem', 
                borderRadius: '0.5rem', 
                border: '1px solid #cbd5e1', 
                fontSize: '0.8125rem', 
                outline: 'none',
                backgroundColor: '#f8fafc' 
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
          
          {/* Assigned Worker Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Assigned Worker:</label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: 500
              }}
            >
              <option value="ALL">All Staff Members</option>
              <option value="UNASSIGNED">Unassigned Leads</option>
              {staffMembers.map((s: any) => (
                <option key={s.id} value={s.name}>{s.name} ({s.staffId || 'Staff'})</option>
              ))}
            </select>
          </div>

          {/* Project Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Project Type:</label>
            <select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: 500
              }}
            >
              <option value="ALL">All Project Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
              <option value="General Enquiry">General Enquiry</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px dashed #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#ef4444',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginLeft: 'auto'
              }}
            >
              <X size={14} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            Showing {filteredLeads.length} Leads
          </div>
          {filteredLeads.length !== leads.length && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              (Filtered from {leads.length} total)
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lead Ref</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Name</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Type</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Executive</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4, display: 'block' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.25rem' }}>No leads found</div>
                    <div style={{ fontSize: '0.85rem' }}>Adjust your filter criteria or search query to see records.</div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, index) => {
                  const badge = getStatusBadgeStyle(lead.status);
                  const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr 
                      key={lead.id || index} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa')}
                    >
                      {/* Action buttons */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button 
                            onClick={() => setViewingLead(lead)}
                            style={{ 
                              padding: '0.4rem', 
                              borderRadius: '0.375rem', 
                              backgroundColor: '#eff6ff', 
                              border: '1px solid #bfdbfe', 
                              color: 'var(--primary)', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="View Full Lead Details"
                          >
                            <Info size={15} />
                          </button>

                          <button 
                            onClick={() => navigate('/admin/applications/new', { state: { lead } })}
                            style={{ 
                              padding: '0.4rem 0.65rem', 
                              borderRadius: '0.375rem', 
                              backgroundColor: '#1d4ed8', 
                              border: 'none', 
                              color: '#ffffff', 
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              whiteSpace: 'nowrap'
                            }}
                            title="Convert into Application"
                          >
                            <UserCheck size={13} /> Convert
                          </button>

                          <button
                            onClick={() => handleDeleteLead(lead)}
                            style={{ 
                              padding: '0.4rem', 
                              borderRadius: '0.375rem', 
                              backgroundColor: 'transparent', 
                              border: 'none', 
                              color: '#94a3b8', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            title="Delete Lead"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                      {/* Lead Ref */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {lead.displayId}
                        </span>
                        {lead.days !== undefined && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {lead.days === 0 ? 'Today' : `${lead.days}d ago`}
                          </div>
                        )}
                      </td>

                      {/* Client Name & Location */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                          {lead.name}
                        </div>
                        {lead.location && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                            <MapPin size={12} color="#94a3b8" /> {lead.location}
                          </div>
                        )}
                      </td>

                      {/* Contact Details with Quick Links */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                            {lead.phone || 'No phone'}
                          </span>
                          
                          {cleanPhone && (
                            <>
                              <a
                                href={`tel:${cleanPhone}`}
                                title={`Call ${lead.name}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.45rem',
                                  borderRadius: '0.25rem',
                                  backgroundColor: '#f1f5f9',
                                  color: '#0284c7',
                                  textDecoration: 'none'
                                }}
                              >
                                <Phone size={13} />
                              </a>
                              <a
                                href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello ${lead.name}, regarding your building approval enquiry #${lead.displayId} with CB Approvals:`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.45rem',
                                  borderRadius: '0.25rem',
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  textDecoration: 'none'
                                }}
                              >
                                <MessageCircle size={13} />
                              </a>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Project Type */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.25rem',
                          display: 'inline-block'
                        }}>
                          {lead.projectType}
                        </span>
                      </td>

                      {/* Status Dropdown / Badge */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select
                          value={lead.status || 'New'}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '1rem',
                            border: '1px solid transparent',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="New">New Lead</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Application Created">Application Created</option>
                          <option value="Converted">Converted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* Assigned Worker */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <select
                          value={lead.assignedTo || ''}
                          onChange={(e) => handleAssignWorker(lead.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.78rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #cbd5e1',
                            backgroundColor: lead.assignedTo ? '#f0fdf4' : '#fffbeb',
                            color: lead.assignedTo ? '#166534' : '#b45309',
                            fontWeight: 600,
                            maxWidth: '180px'
                          }}
                        >
                          <option value="">Unassigned</option>
                          {staffMembers.map((s: any) => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {lead.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgraded Lead Details Modal */}
      {viewingLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
                    Lead Details: {viewingLead.displayId}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '1rem',
                    ...getStatusBadgeStyle(viewingLead.status)
                  }}>
                    {viewingLead.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Created on {viewingLead.date} {viewingLead.days ? `• ${viewingLead.days} days elapsed` : ''}
                </div>
              </div>

              <button 
                onClick={() => setViewingLead(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.35rem',
                  borderRadius: '0.375rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              
              {/* Communication Quick-Action Bar */}
              <div style={{
                backgroundColor: '#eff6ff',
                borderRadius: '0.75rem',
                border: '1px solid #bfdbfe',
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600 }}>Quick Outreach to Customer:</div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#1e3a8a' }}>{viewingLead.phone || 'No phone provided'}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {viewingLead.phone && (
                    <>
                      <a
                        href={`tel:${viewingLead.phone.replace(/[^0-9]/g, '')}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        <Phone size={14} /> Call Client
                      </a>

                      <a
                        href={`https://wa.me/91${viewingLead.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${viewingLead.name}, thank you for reaching out to CB Building Approvals regarding #${viewingLead.displayId}. How can we assist you today?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#25D366',
                          color: '#ffffff',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Grid of Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                <div style={{ padding: '0.85rem 1rem', borderRadius: '0.625rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Customer Name
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    {viewingLead.name}
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', borderRadius: '0.625rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Project / Product Type
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a' }}>
                    {viewingLead.projectType}
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', borderRadius: '0.625rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Property Location
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    {viewingLead.location || 'Location Not Specified'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', borderRadius: '0.625rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Assigned Executive
                  </div>
                  <select
                    value={viewingLead.assignedTo || ''}
                    onChange={(e) => handleAssignWorker(viewingLead.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {staffMembers.map((s: any) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.staffId || 'Staff'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Property Details Box */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Property / Plot Particulars
                </div>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '0.85rem', 
                  color: '#334155',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {viewingLead.propertyDetails || 'General enquiry received via website popup.'}
                </div>
              </div>

              {/* Uploaded Documents */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Uploaded Documents
                  </h4>
                </div>

                {(() => {
                  const up = viewingLead.uploadedFiles || {};
                  const seenUrls = new Set<string>();
                  const docList: { key: string; name: string; url: string }[] = [];

                  for (const [k, v] of Object.entries(up)) {
                    if (v && typeof v === 'string' && !seenUrls.has(v) && !['username', 'password', 'receiptNumber'].includes(k)) {
                      seenUrls.add(v);
                      docList.push({
                        key: k,
                        name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        url: v
                      });
                    }
                  }

                  if (viewingLead.aadharFile && !seenUrls.has(viewingLead.aadharFile)) {
                    seenUrls.add(viewingLead.aadharFile);
                    docList.push({
                      key: 'AADHAAR',
                      name: viewingLead.aadharFileName || 'Aadhaar Card',
                      url: viewingLead.aadharFile
                    });
                  }

                  if (viewingLead.buildingPhoto && !seenUrls.has(viewingLead.buildingPhoto)) {
                    seenUrls.add(viewingLead.buildingPhoto);
                    docList.push({
                      key: 'BUILDING_PHOTO',
                      name: viewingLead.buildingPhotoName || 'Site / Building Photo',
                      url: viewingLead.buildingPhoto
                    });
                  }

                  if (docList.length === 0) {
                    return (
                      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
                        <FileText size={24} style={{ margin: '0 auto 0.4rem', opacity: 0.5, display: 'block' }} />
                        No documents uploaded yet for this lead.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {docList.map((doc, dIdx) => (
                        <div 
                          key={dIdx} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '0.75rem 1rem', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '0.5rem',
                            backgroundColor: '#ffffff' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <FileText size={18} color="var(--primary)" />
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: '#1e293b', display: 'block' }}>{doc.name}</strong>
                              <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Ready to view</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => window.open(doc.url, '_blank')}
                              style={{
                                padding: '0.35rem 0.65rem',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: '#1e293b'
                              }}
                            >
                              <Eye size={13} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadLeadFile(doc.url, `${doc.name.replace(/\s+/g, '_')}.jpg`)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                backgroundColor: 'var(--primary)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Download size={13} /> Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setViewingLead(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>

              <button
                onClick={() => {
                  const leadToConvert = viewingLead;
                  setViewingLead(null);
                  navigate('/admin/applications/new', { state: { lead: leadToConvert } });
                }}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                }}
              >
                <UserCheck size={16} /> Convert to Government Application
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerLeads;
