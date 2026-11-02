import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Copy, MessageCircle, Link as LinkIcon, CheckCircle2, Eye, Download, X, FileText, FileUp } from 'lucide-react';
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
  const [viewingAppDocs, setViewingAppDocs] = useState<any | null>(null);

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

  const tabs = ['All', 'In Progress', 'Documents Pending', 'Verification', 'Approved', 'Rejected'];

  const matchesTab = (status: string, tab: string) => {
    if (tab === 'All') return true;
    const s = (status || '').toUpperCase();
    const clean = s.replace(/[\s_-]+/g, '');
    if (tab === 'Documents Pending') {
      return ['DOCUMENT_COLLECTION', 'DOCUMENTS_PENDING', 'DOCUMENTS PENDING', 'INTAKE', 'ACTION_NEEDED', 'ACTION REQUIRED', 'NEW', 'DRAFT', 'PENDING_DOCUMENTS'].includes(s) || clean.includes('PENDING') || clean.includes('INTAKE') || clean === 'DRAFT';
    }
    if (tab === 'Verification') {
      return ['DOCUMENTS_VERIFICATION', 'SCRUTINY', 'SITE INSPECTION', 'UNDER REVIEW', 'SUBMITTED', 'SUBMITTED_FOR_APPROVAL', 'VERIFICATION', 'GOV VERIFICATION', 'WORKER VERIFIED'].includes(s) || clean.includes('VERIF') || clean.includes('REVIEW') || clean.includes('INSPECTION');
    }
    if (tab === 'Approved') {
      return ['APPROVED', 'COMPLETED'].includes(s) || clean.includes('APPROV') || clean.includes('COMPLETE');
    }
    if (tab === 'Rejected') {
      return s === 'REJECTED' || clean.includes('REJECT');
    }
    if (tab === 'In Progress') {
      return !['APPROVED', 'COMPLETED', 'REJECTED'].includes(s) && !clean.includes('APPROV') && !clean.includes('REJECT');
    }
    return s === tab.toUpperCase() || clean === tab.toUpperCase().replace(/[\s_-]+/g, '');
  };

  const formatStatus = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['APPROVED', 'COMPLETED'].includes(s)) return 'Approved';
    if (['DOCUMENT_COLLECTION', 'DOCUMENTS_PENDING', 'INTAKE', 'NEW', 'DRAFT'].includes(s)) return 'Documents Pending';
    if (['DOCUMENTS_VERIFICATION', 'WORKER VERIFIED', 'SCRUTINY', 'VERIFICATION'].includes(s)) return 'Verification';
    if (['SUBMITTED', 'SUBMITTED_FOR_APPROVAL', 'UNDER REVIEW'].includes(s)) return 'Gov Review';
    if (s === 'REJECTED') return 'Rejected';
    return status?.replace(/_/g, ' ') || 'In Progress';
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toUpperCase();
    if (['APPROVED', 'COMPLETED'].includes(s)) {
      return { backgroundColor: 'rgba(34, 160, 107, 0.1)', color: 'var(--success-green)', border: '1px solid rgba(34, 160, 107, 0.2)' };
    }
    if (['DOCUMENT_COLLECTION', 'DOCUMENTS_PENDING', 'INTAKE', 'NEW'].includes(s)) {
      return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-red)', border: '1px solid rgba(239, 68, 68, 0.2)' };
    }
    if (['DOCUMENTS_VERIFICATION', 'WORKER VERIFIED', 'SCRUTINY'].includes(s)) {
      return { backgroundColor: 'rgba(214, 167, 86, 0.15)', color: '#b45309', border: '1px solid rgba(214, 167, 86, 0.3)' };
    }
    return { backgroundColor: 'rgba(30, 58, 138, 0.08)', color: 'var(--primary)', border: '1px solid rgba(30, 58, 138, 0.2)' };
  };

  const filteredApps = applications.filter(app => {
    if (!matchesTab(app.status, activeTab)) return false;
    
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Assigned applications for <strong>{employeeName}</strong> {employeeId ? `(${employeeId})` : ''}
          </p>
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
                      padding: '0.3rem 0.6rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      display: 'inline-block',
                      ...getStatusBadgeStyle(app.status)
                    }}>
                      {formatStatus(app.status)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setViewingAppDocs(app)}
                        title="View Customer Uploaded Documents"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--primary-dark)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          padding: '0.4rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Eye size={13} /> View Docs
                      </button>

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
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }} 
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

      {/* Customer Uploaded Documents Modal */}
      {viewingAppDocs && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', width: '100%', maxWidth: '820px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  Customer Uploaded Documents: {viewingAppDocs.id}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Applicant: <strong>{viewingAppDocs.customer}</strong> • Mobile: {viewingAppDocs.mobile || '—'}
                </p>
              </div>
              <button 
                onClick={() => setViewingAppDocs(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {(() => {
                const files = viewingAppDocs.uploadedFiles || {};
                const localDocsStr = localStorage.getItem(`customerDocs_${viewingAppDocs.id}`);
                const localDocs = localDocsStr ? JSON.parse(localDocsStr) : [];
                
                const docEntries: { name: string; url: string }[] = [];
                Object.entries(files).forEach(([k, v]) => {
                  if (v && typeof v === 'string') {
                    docEntries.push({ name: k.replace(/_/g, ' '), url: v });
                  }
                });

                localDocs.forEach((d: any) => {
                  const url = d.fileData || d.url || d.file;
                  if (url && !docEntries.some(e => e.name.toLowerCase() === d.name.toLowerCase())) {
                    docEntries.push({ name: d.name, url });
                  }
                });

                if (docEntries.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                      <FileUp size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-dark)', fontSize: '1rem', fontWeight: 600 }}>No documents uploaded yet</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>The customer has not uploaded files yet. You can share the upload link via WhatsApp.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {docEntries.map((doc, idx) => {
                      const isPdf = doc.url.endsWith('.pdf') || doc.url.startsWith('data:application/pdf');
                      const isImg = doc.url.startsWith('data:image/') || doc.url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) || (doc.url.includes('cloudinary.com') && !isPdf);

                      return (
                        <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-dark)', minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                            {doc.name}
                          </div>
                          
                          <div style={{ height: '140px', backgroundColor: '#e2e8f0', borderRadius: '0.375rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isImg ? (
                              <img src={doc.url} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : isPdf ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#0284c7' }}>
                                <FileText size={40} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.35rem' }}>PDF Document</span>
                              </div>
                            ) : (
                              <FileText size={40} color="var(--text-secondary)" />
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ flex: 1, padding: '0.4rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '0.25rem', textAlign: 'center', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            >
                              <Eye size={13} /> View
                            </a>
                            <a 
                              href={doc.url} 
                              download={doc.name} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ flex: 1, padding: '0.4rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '0.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                            >
                              <Download size={13} /> Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => setViewingAppDocs(null)} 
                style={{ padding: '0.5rem 1.25rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  const targetId = viewingAppDocs.id;
                  setViewingAppDocs(null);
                  navigate(`/employee/applications/${targetId}`);
                }}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
              >
                Process This Application →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
