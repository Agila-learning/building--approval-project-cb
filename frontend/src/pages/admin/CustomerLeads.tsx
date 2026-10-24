import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, X, Pencil, Info, ArrowUpDown, Plus } from 'lucide-react';


const CustomerLeads: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [viewingLead, setViewingLead] = useState<any | null>(null);
  
  const [filterOn, setFilterOn] = useState('select');
  const [subFilter, setSubFilter] = useState('select');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/leads`);
        if (res.ok) {
          const data = await res.json();
          const formattedLeads = data
            .filter((lead: any) => lead.type === 'Lead')
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
              days: (() => {
                 if (!lead.created_at) return 0;
                 const start = new Date(lead.created_at).getTime();
                 const isCompleted = ['Rejected', 'Approved'].includes(lead.status);
                 const end = isCompleted && lead.updated_at ? new Date(lead.updated_at).getTime() : new Date().getTime();
                 return Math.ceil(Math.max(0, end - start) / (1000 * 60 * 60 * 24));
              })(),
              status: lead.status,
              assignedTo: lead.assignedTo || '',
              aadharFile: lead.aadharFile,
              aadharFileName: lead.aadharFileName,
              buildingPhoto: lead.buildingPhoto,
              buildingPhotoName: lead.buildingPhotoName
            }));
          setLeads(formattedLeads);
        } else {
          // Fallback to local storage if API fails
          const saved = localStorage.getItem('mock_saved_cases');
          if (saved) {
            const localCases = JSON.parse(saved).filter((c: any) => c.type === 'Lead');
            setLeads(localCases);
          } else {
            setLeads([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch leads:", error);
        // Fallback to local storage
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
    
    // Periodically refresh (since localStorage event won't fire across devices)
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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      await fetch(`${apiUrl}/leads/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      });
    } catch (e) {
      console.error(e);
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
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {lead.assignedTo || 'Unassigned'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                    {lead.days !== undefined ? `${lead.days} ${lead.days === 1 ? 'day' : 'days'}` : '—'}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setViewingLead(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Lead Details - {viewingLead.displayId}</h3>
            
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
