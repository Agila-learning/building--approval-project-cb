import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Pencil, Info, ArrowUpDown, Plus, UserCheck, Eye, Download, Trash2 } from 'lucide-react';
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
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [viewingLead, setViewingLead] = useState<any | null>(null);
  
  const [filterOn, setFilterOn] = useState('select');
  const [subFilter, setSubFilter] = useState('select');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
    fetchStaff();
  }, []);

  const computeDaysElapsed = (rawDate: any, status?: string, updatedDate?: any) => {
    if (!rawDate) return 0;
    const start = new Date(rawDate).getTime();
    if (isNaN(start)) return 0;
    const isCompleted = ['Rejected', 'Approved', 'Application Created', 'Converted'].includes(status || '');
    const end = isCompleted && updatedDate && !isNaN(new Date(updatedDate).getTime()) ? new Date(updatedDate).getTime() : Date.now();
    const diffDays = Math.floor(Math.max(0, end - start) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const apiUrl = getApiUrl();
        const leadsRes = await fetch(`${apiUrl}/leads`);

        let combinedLeads: any[] = [];

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          const formattedLeads = data
            .filter((lead: any) => lead.type === 'Lead' || lead.type === 'Enquiry')
            .map((lead: any) => {
              const leadDateRaw = lead.created_at || lead.createdAt;
              const leadDateDisplay = leadDateRaw && !isNaN(new Date(leadDateRaw).getTime())
                ? new Date(leadDateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              const days = computeDaysElapsed(leadDateRaw, lead.status, lead.updated_at || lead.updatedAt);

              return {
                id: lead.id,
                displayId: lead.leadId || lead.id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email || '',
                location: lead.location || '',
                projectType: lead.projectType || 'General Enquiry',
                propertyDetails: lead.propertyDetails || 'General Enquiry via Popup',
                date: leadDateDisplay,
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
                displayId: c.leadId || c.id,
                name: prop.owner_name || full.customerName || 'Lead Prospect',
                phone: prop.owner_phone || full.mobile || '',
                email: prop.owner_email || full.email || '',
                location: prop.address || prop.village || '',
                projectType: c.approval_type || full.serviceType || 'General Enquiry',
                propertyDetails: full.propertyDetails || 'Inquiry',
                date: leadDateDisplay,
                days,
                status: c.status || 'New',
                assignedTo: c.assigned_staff?.name || full.staff || '',
                isCase: false
              };
            });

          const existingIds = new Set(combinedLeads.map(l => l.displayId));
          for (const ll of localLeads) {
            if (!existingIds.has(ll.displayId)) {
              combinedLeads.push(ll);
            }
          }
        }

        setLeads(combinedLeads);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
        const saved = localStorage.getItem('mock_saved_cases');
        if (saved) {
          const localCases = JSON.parse(saved).filter((c: any) => c.type === 'Lead');
          setLeads(localCases);
        } else {
          setLeads([]);
        }
      }
    };
    
    loadLeads();
    
    const interval = setInterval(loadLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReject = async () => {
    if (!rejectingLeadId || !rejectionRemarks.trim()) return;
    const updatedLeads = leads.map(lead => lead.id === rejectingLeadId ? { ...lead, status: 'Rejected', rejectionRemarks } : lead);
    setLeads(updatedLeads);
    const id = rejectingLeadId;
    setRejectingLeadId(null);
    setRejectionRemarks('');
    
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/leads/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      });
    } catch (e) {
      console.error(e);
    }
  };

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

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      (lead.displayId || '').toLowerCase().includes(searchLower) ||
      (lead.name || '').toLowerCase().includes(searchLower) ||
      (lead.phone || '').includes(searchLower);
      
    let matchesFilter = true;
    if (filterOn === 'Product' && subFilter !== 'select') {
      matchesFilter = (lead.projectType || 'General Enquiry') === subFilter;
    } else if (filterOn === 'Status' && subFilter !== 'select') {
      matchesFilter = lead.status === subFilter;
    }
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
          Customer Leads
        </h1>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }} onClick={() => navigate('/admin/leads/new')}>
          <Plus size={18} /> Add Lead
        </button>
      </div>

      {/* Pipeline Distinction Banner */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderLeft: '4px solid #2563eb',
        borderRadius: '0.5rem',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#1e3a8a',
        fontSize: '0.875rem',
        lineHeight: 1.5
      }}>
        <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
        <div>
          <strong>Prospective Customer Inquiries (CRM Leads):</strong> Potential clients who have submitted inquiries or requested quotations. Review interest, follow up with them, and click <strong>"Convert"</strong> when ready to file their official government approval application.
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Proposal Process</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter On:</label>
                <select 
                  value={filterOn} 
                  onChange={(e) => { setFilterOn(e.target.value); setSubFilter('select'); }}
                  style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', minWidth: '150px', backgroundColor: 'var(--bg-surface)' }}
                >
                  <option value="select">select</option>
                  <option value="Product">Product</option>
                  <option value="Status">Status</option>
                </select>
              </div>
              
              {filterOn !== 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select {filterOn}:</label>
                  <select 
                    value={subFilter} 
                    onChange={(e) => setSubFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', minWidth: '150px', backgroundColor: 'var(--bg-surface)' }}
                  >
                    <option value="select">select</option>
                    {filterOn === 'Product' && (
                      <>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="General Enquiry">General Enquiry</option>
                      </>
                    )}
                    {filterOn === 'Status' && (
                      <>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Application Created">Application Created</option>
                        <option value="Rejected">Rejected</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div style={{ position: 'relative', width: '300px', alignSelf: 'flex-end' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search any Values.." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'transparent' }}
            />
          </div>
        </div>
        
        <div style={{ padding: '0 1.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
          Total {filteredLeads.length} Records
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Edit</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>View</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Convert</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Delete</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Proposal No <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Customer Name <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Mobile Number <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Current Status <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Proposal Date <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Product <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Assigned To <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>No of Days <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button 
                      onClick={() => navigate('/admin/applications/new', { state: { lead } })}
                      style={{ padding: '0.4rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                      title="Edit Lead"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button 
                      onClick={() => setViewingLead(lead)}
                      style={{ padding: '0.4rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                      title="View Details"
                    >
                      <Info size={16} />
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => navigate('/admin/applications/new', { state: { lead } })}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.375rem',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        whiteSpace: 'nowrap'
                      }}
                      title="Convert this lead into a formal government approval application"
                    >
                      <UserCheck size={14} /> Convert
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`Are you sure you want to permanently delete lead ${lead.application_number || lead.displayId} (${lead.name})?`)) return;
                        try {
                          const apiUrl = getApiUrl();
                          await fetch(`${apiUrl}/leads/${lead.id}`, { method: 'DELETE' });
                          const localLeadsStr = localStorage.getItem('mock_leads');
                          if (localLeadsStr) {
                            const localLeads = JSON.parse(localLeadsStr).filter((l: any) => l.id !== lead.id && l.leadId !== lead.displayId);
                            localStorage.setItem('mock_leads', JSON.stringify(localLeads));
                          }
                          setLeads(prev => prev.filter(l => l.id !== lead.id));
                          toast.success(`Lead ${lead.application_number || lead.displayId} deleted successfully.`);
                        } catch (err) {
                          toast.error('Failed to delete lead.');
                        }
                      }}
                      style={{ padding: '0.4rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Delete Lead"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{lead.application_number || lead.displayId}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 500 }}>
                    {lead.name}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {lead.phone}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      backgroundColor: lead.status === 'New' ? '#fee2e2' : lead.status === 'Rejected' ? '#f3f4f6' : lead.status === 'Application Created' ? '#e0e7ff' : 'rgba(34, 160, 107, 0.1)', 
                      color: lead.status === 'New' ? 'var(--error-red)' : lead.status === 'Rejected' ? '#6b7280' : lead.status === 'Application Created' ? '#4f46e5' : 'var(--success-green)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {lead.status}
                    </span>
                    {lead.rejectionRemarks && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--error-red)' }}>
                        <strong>Remark:</strong> {lead.rejectionRemarks}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lead.date}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {lead.projectType}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <select
                      value={lead.assignedTo || ''}
                      onChange={(e) => handleAssignWorker(lead.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.8rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: lead.assignedTo ? '#eff6ff' : '#fff',
                        color: lead.assignedTo ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: lead.assignedTo ? 600 : 400,
                        cursor: 'pointer',
                        outline: 'none',
                        maxWidth: '150px'
                      }}
                    >
                      <option value="">Unassigned</option>
                      {staffMembers.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.name} ({s.staffId || 'Staff'})</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                    {lead.days === 0 ? 'Today' : (lead.days !== undefined ? `${lead.days} ${lead.days === 1 ? 'day' : 'days'}` : '—')}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No customer leads found.</p>
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

      {viewingLead && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '0.75rem' }}>
          <div className="modal-content-responsive" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setViewingLead(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Lead Details - {viewingLead.displayId}</h3>
            
            <div className="modal-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned Worker</strong>
                <select
                  value={viewingLead.assignedTo || ''}
                  onChange={(e) => handleAssignWorker(viewingLead.id, e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#fff',
                    fontWeight: 500
                  }}
                >
                  <option value="">Unassigned</option>
                  {staffMembers.map((s: any) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.staffId || 'Staff'})</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Property Details</strong>
                <div style={{ fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{viewingLead.propertyDetails || 'No additional property details provided.'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Uploaded Documents</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {(() => {
                    const up = viewingLead.uploadedFiles || {};
                    let count = Object.values(up).filter(Boolean).length;
                    if (!up['AADHAR CARD'] && viewingLead.aadharFile) count++;
                    if (!up['BUILDING PHOTO'] && !up['CUSTOMER PHOTOGRAPH'] && viewingLead.buildingPhoto) count++;
                    return `${count} document${count === 1 ? '' : 's'} available`;
                  })()}
                </span>
              </div>

              {(() => {
                const up = viewingLead.uploadedFiles || {};
                const seenUrls = new Set<string>();
                const docList: { key: string; name: string; url: string }[] = [];

                // 1. Files from uploadedFiles map
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

                // 2. Aadhar if separate
                if (viewingLead.aadharFile && !seenUrls.has(viewingLead.aadharFile)) {
                  seenUrls.add(viewingLead.aadharFile);
                  docList.push({
                    key: 'AADHAAR',
                    name: viewingLead.aadharFileName || 'Aadhaar Card',
                    url: viewingLead.aadharFile
                  });
                }

                // 3. Building photo if separate
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
                    <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <FileText size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                      No documents uploaded yet for this lead.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {docList.map((doc, dIdx) => (
                      <div 
                        key={dIdx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.75rem 1rem', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '0.5rem',
                          backgroundColor: 'var(--bg-surface)' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FileText size={18} color="var(--primary)" />
                          <div>
                            <strong style={{ fontSize: '0.875rem', color: 'var(--primary-dark)', display: 'block' }}>{doc.name}</strong>
                            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Ready to view</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => window.open(doc.url, '_blank')}
                            style={{
                              padding: '0.35rem 0.75rem',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: 'var(--primary-dark)'
                            }}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadLeadFile(doc.url, `${doc.name.replace(/\s+/g, '_')}.jpg`)}
                            style={{
                              padding: '0.35rem 0.75rem',
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

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingLead(null)} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLeads;
