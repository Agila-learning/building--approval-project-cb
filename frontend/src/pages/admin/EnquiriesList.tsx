import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Phone, Mail, FileText, CheckCircle, FilePlus, XCircle, X, ExternalLink, Loader2, UserPlus, UserCheck, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const EnquiriesList: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [viewingLead, setViewingLead] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'APPLICATION_CREATED' | 'REJECTED'>('ALL');
  const [isCreatingId, setIsCreatingId] = useState<string | null>(null);

  // Assignment states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assigningLead, setAssigningLead] = useState<any | null>(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/leads`);
        if (res.ok) {
          const data = await res.json();
          const formattedLeads = data
            .filter((lead: any) => lead.type === 'Enquiry')
            .map((lead: any) => ({
              id: lead.id,
              displayId: lead.leadId || lead.id,
              name: lead.name,
              phone: lead.phone,
              email: lead.email || '',
              location: lead.location || '',
              projectType: lead.projectType || 'General Enquiry',
              propertyDetails: lead.propertyDetails || 'General Enquiry via Popup',
              date: new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: lead.status,
              assignedTo: lead.assignedTo || '',
              aadharFile: lead.aadharFile,
              aadharFileName: lead.aadharFileName,
              buildingPhoto: lead.buildingPhoto,
              buildingPhotoName: lead.buildingPhotoName
            }));
          setLeads(formattedLeads);
        } else {
          setLeads([]);
        }
      } catch (error) {
        console.error("Failed to fetch leads:", error);
        setLeads([]);
      }
    };
    
    loadLeads();
    
    // Periodically refresh
    const interval = setInterval(loadLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch available staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/users`);
        if (res.ok) {
          const data = await res.json();
          const activeStaff = data.filter((u: any) => u.status === 'Active' && (u.role === 'STAFF' || !u.role));
          if (activeStaff.length > 0) {
            setStaffList(activeStaff);
            return;
          }
          if (data.length > 0) {
            setStaffList(data);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff list:', err);
      }
      
      const stored = localStorage.getItem('staffMembers');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) {
            setStaffList(parsed);
            return;
          }
        } catch (_) {}
      }
      
      setStaffList([
        { id: '1', name: 'Naveen Kumar' },
        { id: '2', name: 'Suresh Raina' },
        { id: '3', name: 'Priya Sharma' },
        { id: '4', name: 'Dhanush' }
      ]);
    };

    fetchStaff();
  }, []);

  const openAssignModal = (lead: any) => {
    setAssigningLead(lead);
    setSelectedStaff(lead.assignedTo || (staffList[0]?.name || ''));
  };

  const handleAssignSubmit = async () => {
    if (!assigningLead) return;
    setIsAssigning(true);
    const leadId = assigningLead.id;
    const staffName = selectedStaff;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedTo: staffName } : l));
    if (viewingLead && viewingLead.id === leadId) {
      setViewingLead((prev: any) => ({ ...prev, assignedTo: staffName }));
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      const currentLead = leads.find(l => l.id === leadId);
      await fetch(`${apiUrl}/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: currentLead?.status || 'New',
          assignedTo: staffName 
        })
      });
      toast.success(staffName ? `Assigned to ${staffName}` : 'Assignment removed');
      setAssigningLead(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  const markAsContacted = async (id: string) => {
    const updatedLeads = leads.map(lead => lead.id === id ? { ...lead, status: 'Contacted' } : lead);
    setLeads(updatedLeads);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      await fetch(`${apiUrl}/leads/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Contacted' })
      });
      toast.success('Marked as contacted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const handleReject = async () => {
    if (!rejectingLeadId || !rejectionRemarks.trim()) return;
    const updatedLeads = leads.map(lead => lead.id === rejectingLeadId ? { ...lead, status: 'Rejected', rejectionRemarks } : lead);
    setLeads(updatedLeads);
    const id = rejectingLeadId;
    setRejectingLeadId(null);
    setRejectionRemarks('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      await fetch(`${apiUrl}/leads/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      });
      toast.success('Enquiry rejected');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject enquiry');
    }
  };

  const handleCreateApplication = async (lead: any) => {
    setIsCreatingId(lead.id);
    const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
    
    try {
      // 1. Update Lead status to 'Application Created'
      await fetch(`${apiUrl}/leads/${lead.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Application Created' })
      });

      // 2. Create Property in database
      const propRes = await fetch(`${apiUrl}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_name: lead.name,
          owner_phone: lead.phone,
          owner_email: lead.email || '',
          address: lead.location || 'Hosur',
          village: lead.location || 'Hosur',
          taluk: 'Hosur',
          survey_number: lead.propertyDetails?.substring(0, 50) || 'TBD',
          jurisdiction: 'DTCP'
        })
      });

      if (!propRes.ok) {
        const errData = await propRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create property');
      }
      const property = await propRes.json();

      // 3. Create Case / Application in database
      const caseRes = await fetch(`${apiUrl}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          approval_type: 'BUILDING_PLAN_APPROVAL',
          status: 'INTAKE',
          fullData: {
            customerName: lead.name,
            fatherName: '',
            dob: '',
            mobile: lead.phone,
            email: lead.email || '',
            altMobile: '',
            aadhar: '',
            pan: '',
            residentialAddress: {
              houseNo: '',
              streetName: '',
              area: lead.location || '',
              city: lead.location || 'Hosur',
              taluk: 'Hosur',
              pincode: '',
              state: 'Tamil Nadu',
              country: 'INDIA',
              landmark: '',
              accomodationType: 'Own',
              yearsResiding: ''
            },
            permanentAddress: {
              sameAsResidential: true,
              houseNo: '',
              streetName: '',
              area: lead.location || '',
              city: lead.location || 'Hosur',
              taluk: 'Hosur',
              pincode: '',
              state: 'Tamil Nadu',
              country: 'INDIA',
              landmark: ''
            },
            propertyDetails: {
              surveyNo: lead.propertyDetails?.substring(0, 50) || 'TBD',
              pattaNo: '',
              dno: '',
              streetName: '',
              village: lead.location || '',
              panchayat: '',
              city: lead.location || '',
              taluk: 'Hosur',
              pincode: '',
              state: 'Tamil Nadu',
              landmark: ''
            },
            referenceDetails: { source: '', name: '', mobile: '' },
            serviceType: 'building',
            feesAmount: '',
            feeNotes: ''
          },
          uploadedFiles: {
            ...(lead.aadharFile ? { 'AADHAR CARD': lead.aadharFile } : {}),
            ...(lead.buildingPhoto ? { 'BUILDING PLAN': lead.buildingPhoto } : {})
          }
        })
      });

      if (!caseRes.ok) {
        const errData = await caseRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create application case');
      }
      const newCase = await caseRes.json();
      const appNumber = newCase.application_number || newCase.id;

      // 4. Sync with localStorage mock_saved_cases for instantaneous display in Applications list
      try {
        const localCasesStr = localStorage.getItem('mock_saved_cases');
        const localCases = localCasesStr ? JSON.parse(localCasesStr) : [];
        const appCase = {
          id: appNumber,
          application_number: appNumber,
          customer: lead.name,
          mobile: lead.phone,
          location: lead.location || '',
          property: property,
          fullData: newCase.fullData,
          uploadedFiles: newCase.uploadedFiles,
          approval_type: 'BUILDING_PLAN_APPROVAL',
          status: 'INTAKE',
          created_at: newCase.created_at || new Date().toISOString()
        };
        localStorage.setItem('mock_saved_cases', JSON.stringify([appCase, ...localCases]));
      } catch (err) {
        console.error('LocalStorage sync error', err);
      }

      // Update local state
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'Application Created', appNumber } : l));
      toast.success(`Application ${appNumber} created! Moving to Applications...`, { duration: 4000 });

      // Automatically navigate to Applications module so user sees it moved
      setTimeout(() => {
        navigate('/admin/applications');
      }, 1200);

    } catch (e: any) {
      console.error('Error creating application:', e);
      toast.error(e.message || 'Failed to create application');
    } finally {
      setIsCreatingId(null);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Search filter
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (lead.displayId || '').toLowerCase().includes(term) ||
      (lead.name || '').toLowerCase().includes(term) ||
      (lead.phone || '').toLowerCase().includes(term) ||
      (lead.location || '').toLowerCase().includes(term) ||
      (lead.assignedTo || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    // Tab status filter
    if (statusFilter === 'ACTIVE') {
      return lead.status === 'New' || lead.status === 'Contacted';
    }
    if (statusFilter === 'APPLICATION_CREATED') {
      return lead.status === 'Application Created';
    }
    if (statusFilter === 'REJECTED') {
      return lead.status === 'Rejected';
    }
    return true; // 'ALL'
  });

  const countActive = leads.filter(l => l.status === 'New' || l.status === 'Contacted').length;
  const countCreated = leads.filter(l => l.status === 'Application Created').length;
  const countRejected = leads.filter(l => l.status === 'Rejected').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
            Website Enquiries
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review customer enquiries submitted through the web portal and convert them into official applications.
          </p>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'ALL' ? 'var(--primary)' : 'transparent',
              color: statusFilter === 'ALL' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            All ({leads.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'ACTIVE' ? 'var(--primary)' : 'transparent',
              color: statusFilter === 'ACTIVE' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Active ({countActive})
          </button>
          <button
            onClick={() => setStatusFilter('APPLICATION_CREATED')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'APPLICATION_CREATED' ? 'var(--primary)' : 'transparent',
              color: statusFilter === 'APPLICATION_CREATED' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Moved to Application ({countCreated})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: statusFilter === 'REJECTED' ? 'var(--primary)' : 'transparent',
              color: statusFilter === 'REJECTED' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            Rejected ({countRejected})
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search enquiries by name, phone, id, staff..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'var(--bg-surface)' }}
            />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Showing {filteredLeads.length} of {leads.length} enquiries
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Lead ID</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact Info</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Project Details</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assigned Staff</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={lead.id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{lead.displayId}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <Users size={16} />
                      </div>
                      {lead.name}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> {lead.phone}</div>
                      {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14} /> {lead.email}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>{lead.projectType}</div>
                    <div>{lead.location}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lead.date}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      backgroundColor: lead.status === 'New' ? '#fee2e2' : lead.status === 'Rejected' ? '#f3f4f6' : lead.status === 'Application Created' ? '#e0e7ff' : 'rgba(34, 160, 107, 0.1)', 
                      color: lead.status === 'New' ? 'var(--error-red)' : lead.status === 'Rejected' ? '#6b7280' : lead.status === 'Application Created' ? '#4f46e5' : 'var(--success-green)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {lead.status === 'Application Created' ? 'Moved to Application' : lead.status}
                    </span>
                    {lead.rejectionRemarks && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--error-red)' }}>
                        <strong>Remark:</strong> {lead.rejectionRemarks}
                      </div>
                    )}
                  </td>
                  
                  {/* Assigned Staff Column */}
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {lead.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.65rem', 
                          borderRadius: '1rem', 
                          backgroundColor: 'rgba(30, 58, 138, 0.08)', 
                          color: 'var(--primary)', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <UserCheck size={13} /> {lead.assignedTo}
                        </span>
                        <button
                          onClick={() => openAssignModal(lead)}
                          title="Reassign staff"
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        >
                          <Edit size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignModal(lead)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '0.375rem',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px dashed var(--border-color)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <UserPlus size={13} /> Assign
                      </button>
                    )}
                  </td>

                  <td style={{ padding: '1rem 1.5rem' }}>
                    {lead.status === 'New' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => markAsContacted(lead.id)}
                          style={{ padding: '0.45rem 0.85rem', borderRadius: '0.375rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <CheckCircle size={14} /> Mark Contacted
                        </button>
                        <button 
                          onClick={() => openAssignModal(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title={lead.assignedTo ? `Reassign (Current: ${lead.assignedTo})` : 'Assign staff'}
                        >
                          <UserPlus size={14} /> {lead.assignedTo ? 'Reassign' : 'Assign'}
                        </button>
                        <button 
                          onClick={() => setViewingLead(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={14} /> Details
                        </button>
                      </div>
                    )}
                    {lead.status === 'Contacted' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => openAssignModal(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title={lead.assignedTo ? `Reassign (Current: ${lead.assignedTo})` : 'Assign staff'}
                        >
                          <UserPlus size={14} /> {lead.assignedTo ? 'Reassign' : 'Assign'}
                        </button>
                        <button 
                          onClick={() => setViewingLead(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={14} /> Details
                        </button>
                        <button 
                          onClick={() => handleCreateApplication(lead)}
                          disabled={isCreatingId === lead.id}
                          style={{ padding: '0.45rem 0.85rem', borderRadius: '0.375rem', backgroundColor: 'var(--success-green)', color: 'white', border: 'none', cursor: isCreatingId === lead.id ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: isCreatingId === lead.id ? 0.7 : 1 }}
                        >
                          {isCreatingId === lead.id ? <Loader2 size={14} className="spin" /> : <FilePlus size={14} />} 
                          {isCreatingId === lead.id ? 'Creating...' : 'Create App'}
                        </button>
                        <button 
                          onClick={() => setRejectingLeadId(lead.id)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'var(--error-red)', border: '1px solid var(--error-red)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                    {lead.status === 'Application Created' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => navigate('/admin/applications')}
                          style={{ padding: '0.45rem 0.85rem', borderRadius: '0.375rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <ExternalLink size={14} /> View in Applications
                        </button>
                        <button 
                          onClick={() => openAssignModal(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <UserPlus size={14} /> {lead.assignedTo ? 'Reassign' : 'Assign'}
                        </button>
                        <button 
                          onClick={() => setViewingLead(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={14} /> Details
                        </button>
                      </div>
                    )}
                    {lead.status === 'Rejected' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => openAssignModal(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <UserPlus size={14} /> Assign
                        </button>
                        <button 
                          onClick={() => setViewingLead(lead)}
                          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.375rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={14} /> View Details
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No enquiries found for the selected criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectingLeadId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '400px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative' }}>
            <button onClick={() => { setRejectingLeadId(null); setRejectionRemarks(''); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Reject Application</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Rejection Remarks *</label>
              <textarea 
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Please enter the reason for rejection..."
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => { setRejectingLeadId(null); setRejectionRemarks(''); }} style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--primary-dark)', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectionRemarks.trim()}
                style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--error-red)', color: 'white', border: 'none', fontWeight: 500, cursor: rejectionRemarks.trim() ? 'pointer' : 'not-allowed', fontSize: '0.875rem', opacity: rejectionRemarks.trim() ? 1 : 0.6 }}
              >
                Reject Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assigningLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '420px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative' }}>
            <button onClick={() => setAssigningLead(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(30, 58, 138, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>Assign Enquiry</h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {assigningLead.displayId} • {assigningLead.name}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                Select Staff Member *
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'var(--bg-surface)', outline: 'none', color: 'var(--text-primary)' }}
              >
                <option value="">-- Choose a staff member --</option>
                {staffList.map((staff) => (
                  <option key={staff.id || staff.name} value={staff.name}>
                    {staff.name} {staff.mobile ? `(${staff.mobile})` : ''}
                  </option>
                ))}
              </select>
              {assigningLead.assignedTo && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Currently assigned to: <strong style={{ color: 'var(--primary-dark)' }}>{assigningLead.assignedTo}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                onClick={() => setAssigningLead(null)} 
                style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--primary-dark)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignSubmit}
                disabled={!selectedStaff || isAssigning}
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  borderRadius: '0.5rem', 
                  backgroundColor: 'var(--primary)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 600, 
                  cursor: (!selectedStaff || isAssigning) ? 'not-allowed' : 'pointer', 
                  fontSize: '0.875rem',
                  opacity: (!selectedStaff || isAssigning) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isAssigning && <Loader2 size={14} className="spin" />}
                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Details Modal */}
      {viewingLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setViewingLead(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Enquiry Details - {viewingLead.displayId}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Customer Name</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{viewingLead.name}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Project Type</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{viewingLead.projectType}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone Number</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{viewingLead.phone}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Location</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{viewingLead.location}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{viewingLead.status}</div>
              </div>
              <div>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned Staff</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: viewingLead.assignedTo ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {viewingLead.assignedTo || 'Unassigned'}
                  </span>
                  <button
                    onClick={() => openAssignModal(viewingLead)}
                    style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <UserPlus size={12} /> {viewingLead.assignedTo ? 'Change' : 'Assign'}
                  </button>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Property Details</strong>
                <div style={{ fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{viewingLead.propertyDetails || 'No additional property details provided.'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Uploaded Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Aadhar Card</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{viewingLead.aadharFileName || 'Not uploaded'}</div>
                  </div>
                  {viewingLead.aadharFile && (
                    <a href={viewingLead.aadharFile} download={viewingLead.aadharFileName || 'aadhar'} style={{ padding: '0.4rem 1rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.25rem', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>Download</a>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Building Photo (GPS)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{viewingLead.buildingPhotoName || 'Not uploaded'}</div>
                  </div>
                  {viewingLead.buildingPhoto && (
                    <a href={viewingLead.buildingPhoto} download={viewingLead.buildingPhotoName || 'building_photo'} style={{ padding: '0.4rem 1rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.25rem', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>Download</a>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => openAssignModal(viewingLead)}
                style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserPlus size={16} /> {viewingLead.assignedTo ? 'Change Assignee' : 'Assign Staff'}
              </button>
              <button onClick={() => setViewingLead(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-dark)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              {viewingLead.status === 'Contacted' && (
                <button 
                  onClick={() => {
                    const leadToCreate = viewingLead;
                    setViewingLead(null);
                    handleCreateApplication(leadToCreate);
                  }}
                  disabled={isCreatingId === viewingLead.id}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: 'var(--success-green)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FilePlus size={16} /> Create Application
                </button>
              )}
              {viewingLead.status === 'Application Created' && (
                <button 
                  onClick={() => {
                    setViewingLead(null);
                    navigate('/admin/applications');
                  }}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={16} /> View in Applications
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesList;
