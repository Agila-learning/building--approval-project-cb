import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Copy, MessageCircle, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('Employee');
  const [employeeId, setEmployeeId] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAssignedCases = useCallback(async (userName: string, staffIdVal: string) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases?role=STAFF&staffName=${encodeURIComponent(userName)}&staffId=${encodeURIComponent(staffIdVal)}`, {
        headers: {
          'x-user-role': 'STAFF',
          'x-user-name': userName,
          'x-staff-id': staffIdVal
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.application_number || c.id,
          mongoId: c.id,
          customer: c.property?.owner_name || c.fullData?.customerName || 'Customer',
          mobile: c.property?.owner_phone || c.fullData?.mobile || '',
          email: c.property?.owner_email || c.fullData?.email || '',
          location: c.property?.address || c.fullData?.propertyDetails?.streetName || c.property?.village || 'Tamil Nadu',
          appType: c.approval_type || c.fullData?.serviceType || 'Building Approval',
          status: c.status || 'DOCUMENTS_PENDING',
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          uploadedFiles: c.uploadedFiles || {}
        }));
        setApplications(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch assigned cases for staff:", err);
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser') || 'Employee';
    const staffIdStored = localStorage.getItem('staffId') || '';
    setEmployeeName(user);
    setEmployeeId(staffIdStored);

    fetchAssignedCases(user, staffIdStored);
    const interval = setInterval(() => fetchAssignedCases(user, staffIdStored), 8000);
    return () => clearInterval(interval);
  }, [fetchAssignedCases]);

  const handleShareWhatsApp = (app: any) => {
    const cleanMobile = (app.mobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      toast.error('Customer phone number not available or invalid for WhatsApp.');
      return;
    }
    const uploadUrl = `${window.location.origin}/upload/${app.id}`;
    const text = `Dear ${app.customer},\n\nGreetings from C.B. Building Approvals.\nYour building approval application (${app.id}) is in progress. Please upload your required documents using your secure personal link below:\n\n${uploadUrl}\n\nRequired documents checklist:\n1. Customer Passport Photo & Signature\n2. Aadhar Card & PAN Card\n3. Land Document / Sale Deed\n4. Patta & FMB Copy\n5. Proposed Building Plan\n\nFor any queries, please reply to this chat.\nThank you!`;
    
    window.open(`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = (appId: string) => {
    const uploadUrl = `${window.location.origin}/upload/${appId}`;
    navigator.clipboard.writeText(uploadUrl);
    setCopiedId(appId);
    toast.success('Document upload link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const tabs = ['All', 'In Progress', 'Documents Pending', 'Verification', 'Approved'];

  const filteredApps = applications.filter(app => {
    if (activeTab !== 'All' && app.status !== activeTab) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return app.id.toLowerCase().includes(term) || 
             app.customer.toLowerCase().includes(term) || 
             app.location.toLowerCase().includes(term) ||
             (app.appType && app.appType.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>My Applications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage and process applications assigned to you.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/employee/applications/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> New Application
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tabs & Search */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search applications..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App ID & Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer & Location</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length > 0 ? filteredApps.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer' }} onClick={() => navigate(`/employee/applications/${app.id}`)}>
                        {app.id}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(app.id);
                          const btn = e.currentTarget;
                          btn.style.color = 'var(--success-green)';
                          setTimeout(() => btn.style.color = 'var(--text-secondary)', 2000);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem', display: 'flex', transition: 'color 0.2s' }}
                        title="Copy Application ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.date}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {app.customer}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {app.mobile ? `📱 ${app.mobile}` : app.location}
                    </div>
                    {app.mobile && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{app.location}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--primary-dark)' }}>
                    {app.appType || 'Building'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      backgroundColor: app.status === 'Approved' ? 'rgba(47, 125, 90, 0.1)' : app.status === 'Documents Pending' ? 'rgba(185, 74, 72, 0.1)' : 'rgba(30, 58, 138, 0.05)', 
                      color: app.status === 'Approved' ? 'var(--success-green)' : app.status === 'Documents Pending' ? 'var(--error-red)' : 'var(--primary)' 
                    }}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleShareWhatsApp(app)}
                        title="Send Upload Link via WhatsApp"
                        style={{
                          backgroundColor: '#25D366',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>

                      <button 
                        onClick={() => handleCopyLink(app.id)}
                        title="Copy Customer Upload Link"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: copiedId === app.id ? 'var(--success-green)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          padding: '0.4rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {copiedId === app.id ? <CheckCircle2 size={14} /> : <LinkIcon size={14} />}
                      </button>

                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }} 
                        onClick={() => navigate(`/employee/applications/${app.id}`)}
                      >
                        Process
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No applications found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
