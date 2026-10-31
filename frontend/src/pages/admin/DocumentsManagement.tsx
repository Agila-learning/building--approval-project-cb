import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, Search, Eye, 
  Download, Filter, RefreshCw, X, Check, ShieldCheck, User, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

interface DocumentRecord {
  id: string;
  caseId: string;
  proposalNumber: string;
  customerName: string;
  customerPhone?: string;
  docKey: string;
  documentKey?: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'Pending Review' | 'Verified' | 'Re-upload Required';
  verificationStatus?: string;
  verifiedBy?: string;
  reuploadReason?: string;
  rejectionReason?: string;
}

const DocumentsManagement: React.FC = () => {
  const loggedInUser = localStorage.getItem('loggedInUser') || 'Admin';
  const userRole = localStorage.getItem('userRole') || (loggedInUser === 'Admin' ? 'ADMIN' : 'STAFF');
  const staffId = localStorage.getItem('staffId') || '';
  const isAdmin = userRole === 'ADMIN' || loggedInUser === 'Admin';

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Preview Modal
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string } | null>(null);

  // Re-upload Reason Modal
  const [reuploadTarget, setReuploadTarget] = useState<DocumentRecord | null>(null);
  const [reuploadReason, setReuploadReason] = useState('');
  const [isSubmittingReupload, setIsSubmittingReupload] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/documents`, {
        headers: {
          'x-user-role': userRole,
          'x-user-name': loggedInUser,
          'x-staff-id': staffId
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        toast.error('Failed to load documents.');
      }
    } catch (e: any) {
      console.error('Error fetching documents:', e);
      toast.error('Network error loading documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userRole, loggedInUser, staffId]);

  // Summary counts
  const summary = React.useMemo(() => {
    const total = documents.length;
    const pending = documents.filter(d => d.status === 'Pending Review').length;
    const verified = documents.filter(d => d.status === 'Verified').length;
    const reupload = documents.filter(d => d.status === 'Re-upload Required').length;
    return { total, pending, verified, reupload };
  }, [documents]);

  const filteredDocs = React.useMemo(() => {
    return documents.filter(doc => {
      // Status filter
      if (filterStatus === 'PENDING' && doc.status !== 'Pending Review') return false;
      if (filterStatus === 'VERIFIED' && doc.status !== 'Verified') return false;
      if (filterStatus === 'REUPLOAD' && doc.status !== 'Re-upload Required') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          doc.customerName.toLowerCase().includes(q) ||
          doc.proposalNumber.toLowerCase().includes(q) ||
          doc.name.toLowerCase().includes(q) ||
          doc.docKey.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, filterStatus, searchTerm]);

  const sendWhatsAppReupload = (doc: DocumentRecord) => {
    const rawPhone = doc.customerPhone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const origin = window.location.origin;
    const uploadUrl = `${origin}/upload/${doc.caseId}`;
    const text = `Dear ${doc.customerName}, CB Building Approvals requires you to re-upload "${doc.name}" for Application Proposal #${doc.proposalNumber}.\n\nReason: ${doc.reuploadReason || 'Please upload a clearer copy.'}\n\nPlease click the link below to upload your document securely:\n${uploadUrl}\n\nThank you,\nCB Building Approvals`;
    
    const waUrl = cleanPhone 
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleVerify = async (doc: DocumentRecord) => {
    try {
      const apiUrl = getApiUrl();
      const targetKey = doc.docKey || doc.documentKey || doc.id.split('_').slice(1).join('_');
      const res = await fetch(`${apiUrl}/documents/verify-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          caseId: doc.caseId,
          docKey: targetKey,
          documentKey: targetKey,
          status: 'Verified',
          verifiedBy: loggedInUser
        })
      });

      if (res.ok) {
        toast.success(`${doc.name} marked as Verified!`);
        setDocuments(prev => prev.map(d => (d.caseId === doc.caseId && (d.docKey === doc.docKey || d.id === doc.id)) ? { ...d, status: 'Verified', verificationStatus: 'Verified', verifiedBy: loggedInUser } : d));
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || 'Failed to update verification status.');
      }
    } catch (e) {
      toast.error('Error connecting to server.');
    }
  };

  const handleOpenReuploadModal = (doc: DocumentRecord) => {
    setReuploadTarget(doc);
    setReuploadReason(doc.reuploadReason || '');
  };

  const handleSubmitReupload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadTarget) return;

    if (!reuploadReason.trim()) {
      toast.error('Please specify why this document requires re-upload.');
      return;
    }

    setIsSubmittingReupload(true);
    try {
      const apiUrl = getApiUrl();
      const targetKey = reuploadTarget.docKey || reuploadTarget.documentKey || reuploadTarget.id.split('_').slice(1).join('_');
      const res = await fetch(`${apiUrl}/documents/verify-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          caseId: reuploadTarget.caseId,
          docKey: targetKey,
          documentKey: targetKey,
          status: 'Re-upload Required',
          verifiedBy: loggedInUser,
          reuploadReason: reuploadReason.trim(),
          rejectionReason: reuploadReason.trim()
        })
      });

      if (res.ok) {
        toast.success(`Marked ${reuploadTarget.name} for re-upload.`);
        const updatedTarget = {
          ...reuploadTarget,
          status: 'Re-upload Required' as const,
          verificationStatus: 'Re-upload Required',
          verifiedBy: loggedInUser,
          reuploadReason: reuploadReason.trim()
        };
        setDocuments(prev => prev.map(d => (d.caseId === reuploadTarget.caseId && (d.docKey === reuploadTarget.docKey || d.id === reuploadTarget.id)) ? updatedTarget : d));
        
        // Open WhatsApp prompt
        sendWhatsAppReupload(updatedTarget);
        setReuploadTarget(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(errJson.error || 'Failed to flag for re-upload.');
      }
    } catch (e) {
      toast.error('Network error.');
    } finally {
      setIsSubmittingReupload(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-2" style={{ margin: 0 }}>Document Management</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isAdmin ? 'Review, verify, and manage all customer uploaded documents across applications.' : 'Review and verify documents for your assigned customer applications.'}
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--primary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Documents
        </button>
      </div>

      {/* Summary Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Uploaded */}
        <div 
          onClick={() => setFilterStatus('ALL')}
          className="card" 
          style={{ 
            padding: '1.25rem', 
            cursor: 'pointer',
            border: filterStatus === 'ALL' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Uploaded
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '0.25rem' }}>
                {summary.total}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', backgroundColor: 'rgba(30, 58, 138, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={22} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            All active customer uploads
          </div>
        </div>

        {/* Pending Review */}
        <div 
          onClick={() => setFilterStatus('PENDING')}
          className="card" 
          style={{ 
            padding: '1.25rem', 
            cursor: 'pointer',
            border: filterStatus === 'PENDING' ? '2px solid #0284c7' : '1px solid var(--border-color)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Review
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0369a1', marginTop: '0.25rem' }}>
                {summary.pending}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.5rem', fontWeight: 600 }}>
            Awaiting verification check
          </div>
        </div>

        {/* Verified */}
        <div 
          onClick={() => setFilterStatus('VERIFIED')}
          className="card" 
          style={{ 
            padding: '1.25rem', 
            cursor: 'pointer',
            border: filterStatus === 'VERIFIED' ? '2px solid #10b981' : '1px solid var(--border-color)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                {summary.verified}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 600 }}>
            Permanently approved docs
          </div>
        </div>

        {/* Re-upload Required */}
        <div 
          onClick={() => setFilterStatus('REUPLOAD')}
          className="card" 
          style={{ 
            padding: '1.25rem', 
            cursor: 'pointer',
            border: filterStatus === 'REUPLOAD' ? '2px solid #ef4444' : '1px solid var(--border-color)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Re-upload Required
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.25rem' }}>
                {summary.reupload}
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem', fontWeight: 600 }}>
            Customer action requested
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'All Documents', count: summary.total },
              { key: 'PENDING', label: 'Pending Review', count: summary.pending },
              { key: 'VERIFIED', label: 'Verified', count: summary.verified },
              { key: 'REUPLOAD', label: 'Re-upload Required', count: summary.reupload },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '2rem',
                  border: filterStatus === f.key ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: filterStatus === f.key ? 'var(--primary)' : 'var(--bg-surface)',
                  color: filterStatus === f.key ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s'
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  padding: '0.1rem 0.45rem',
                  borderRadius: '1rem',
                  backgroundColor: filterStatus === f.key ? 'rgba(255,255,255,0.25)' : 'var(--bg-secondary)',
                  color: filterStatus === f.key ? 'white' : 'var(--text-primary)',
                  fontSize: '0.7rem'
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by customer, proposal, doc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--bg-surface)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Customer-Specific Document Checklist Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            Showing {filteredDocs.length} Documents
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Clear Search
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1rem', width: '150px' }}>Customer Name</th>
                <th style={{ padding: '0.85rem 1rem', width: '130px' }}>Proposal Number</th>
                <th style={{ padding: '0.85rem 1rem' }}>Document Type</th>
                <th style={{ padding: '0.85rem 1rem', width: '140px' }}>Uploaded Date</th>
                <th style={{ padding: '0.85rem 1rem', width: '150px' }}>Verification Status</th>
                <th style={{ padding: '0.85rem 1rem', width: '130px' }}>Verified By</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '90px' }}>Preview</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '90px' }}>Download</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', width: '180px' }}>Review Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc, idx) => {
                  const isVerified = doc.status === 'Verified';
                  const isPending = doc.status === 'Pending Review';
                  const isReupload = doc.status === 'Re-upload Required';

                  return (
                    <tr 
                      key={`${doc.caseId}-${doc.docKey}-${idx}`}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(237, 231, 218, 0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Customer Name */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {doc.customerName}
                        </div>
                      </td>

                      {/* Proposal Number */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Link 
                          to={isAdmin ? `/admin/applications/${doc.proposalNumber}/view` : `/employee/applications/${doc.proposalNumber}`}
                          style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
                        >
                          #{doc.proposalNumber}
                        </Link>
                      </td>

                      {/* Document Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <FileText size={15} color="var(--primary)" />
                          <span>{doc.name}</span>
                        </div>
                        {doc.reuploadReason && (
                          <div style={{ color: '#b91c1c', fontSize: '0.725rem', marginTop: '0.2rem', fontStyle: 'italic' }}>
                            Reason: {doc.reuploadReason}
                          </div>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      {/* Verification Status Badge */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '1rem',
                          backgroundColor: isVerified ? '#dcfce7' : isPending ? '#e0f2fe' : '#fee2e2',
                          color: isVerified ? '#166534' : isPending ? '#0369a1' : '#b91c1c',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                          {doc.status}
                        </span>
                      </td>

                      {/* Verified By */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {doc.verifiedBy || '—'}
                      </td>

                      {/* Preview Button */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setPreviewFile({ title: `${doc.customerName} - ${doc.name}`, url: doc.fileUrl })}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.25rem',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Preview Document"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>

                      {/* Download Button */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.25rem',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            textDecoration: 'none'
                          }}
                          title="Download Document"
                        >
                          <Download size={13} />
                        </a>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          {!isVerified && (
                            <button
                              onClick={() => handleVerify(doc)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Verify Document"
                            >
                              <Check size={13} /> Verify
                            </button>
                          )}

                          {!isReupload ? (
                            <button
                              onClick={() => handleOpenReuploadModal(doc)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fca5a5',
                                color: '#b91c1c',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Request Re-upload"
                            >
                              <AlertTriangle size={13} /> Re-upload
                            </button>
                          ) : (
                            <button
                              onClick={() => sendWhatsAppReupload(doc)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.25rem',
                                backgroundColor: '#16a34a',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Send WhatsApp Re-upload Link to Customer"
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No customer documents found matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Re-upload Reason Modal */}
      {reuploadTarget && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '480px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              backgroundColor: '#b91c1c',
              color: 'white',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Request Document Re-upload</h3>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.2rem' }}>
                  {reuploadTarget.name} • {reuploadTarget.customerName} (#{reuploadTarget.proposalNumber})
                </div>
              </div>
              <button
                onClick={() => setReuploadTarget(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReupload} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                  Reason for Re-upload (will be displayed to customer) *
                </label>
                <textarea
                  rows={4}
                  value={reuploadReason}
                  onChange={(e) => setReuploadReason(e.target.value)}
                  placeholder="e.g. Scanned copy is blurry / blurred corners. Please re-upload a clear colored photograph or PDF."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setReuploadTarget(null)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReupload}
                  style={{
                    padding: '0.625rem 1.5rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#dc2626',
                    border: 'none',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isSubmittingReupload ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingReupload ? 'Submitting...' : 'Confirm Re-upload Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            maxWidth: '800px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'var(--primary-dark)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{previewFile.title}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '75vh', overflow: 'auto' }}>
              {previewFile.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || previewFile.url.startsWith('data:image/') ? (
                <img src={previewFile.url} alt={previewFile.title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
              ) : previewFile.url.match(/\.pdf($|\?)/i) || previewFile.url.startsWith('data:application/pdf') ? (
                <iframe src={previewFile.url} title={previewFile.title} style={{ width: '100%', height: '550px', border: 'none' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                  <p>Document preview available via download or external viewer.</p>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem', textDecoration: 'none', display: 'inline-block' }}
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsManagement;
