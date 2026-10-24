import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LinkTracking: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      let apiCases: any[] = [];
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      try {
        const res = await fetch(`${apiUrl}/cases`);
        if (res.ok) apiCases = await res.json();
      } catch (e) {
        console.error("Link tracking API fetch failed", e);
      }

      const localCasesStr = localStorage.getItem('mock_saved_cases');
      let localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];
      
      const allCases = [...apiCases, ...localCases];
      const uniqueCases = allCases.filter((app: any, index: number, self: any[]) =>
        index === self.findIndex((a: any) => (a.application_number || a.id) === (app.application_number || app.id))
      );
      
      const mappedApps = uniqueCases.map((c: any) => {
        if (!c.linkTracking) {
          c.linkTracking = {
            sent: false,
            sentDate: null,
            customerUploaded: false,
            uploadDate: null
          };
        }
        const appId = c.application_number || c.id;
        const savedDocs = localStorage.getItem(`customerDocs_${appId}`) || localStorage.getItem(`customerDocs_${c.id}`);
        let hasDocs = false;
        if (savedDocs) {
          try {
            const parsed = JSON.parse(savedDocs);
            hasDocs = parsed && parsed.length > 0;
          } catch (e) {}
        }
        
        if (hasDocs && c.linkTracking) {
           c.linkTracking.customerUploaded = true;
        }

        return {
          id: appId,
          mongoId: c.id,
          originalCase: c,
          customer: c.property?.owner_name || c.fullData?.customerName || 'Unknown',
          mobile: c.property?.owner_phone || c.fullData?.mobile || '',
          ...c.linkTracking
        };
      });
      setApplications(mappedApps);
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleSendLink = async (appId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
    const app = applications.find(a => a.id === appId);
    const hasEmail = app?.originalCase?.fullData?.email || app?.originalCase?.property?.email;
    const sentStatus = hasEmail ? 'success' : 'failed';
    const sentDate = new Date().toISOString();

    const linkTrackingPayload = {
      sent: true,
      sentStatus,
      sendStatus: sentStatus,
      sentDate
    };

    try {
      await fetch(`${apiUrl}/cases/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkTracking: linkTrackingPayload })
      });
    } catch (e) {
      console.error(e);
    }

    if (hasEmail) {
      toast.success(`Upload link sent successfully to customer for ${appId}`);
    } else {
      toast.error(`Failed to send link: No email address found for ${appId}`);
    }

    // Also sync local storage
    const localCasesStr = localStorage.getItem('mock_saved_cases');
    if (localCasesStr) {
      const localCases = JSON.parse(localCasesStr);
      const cIndex = localCases.findIndex((c: any) => (c.application_number || c.id) === appId);
      if (cIndex !== -1) {
        localCases[cIndex].linkTracking = {
          ...localCases[cIndex].linkTracking,
          ...linkTrackingPayload
        };
        localStorage.setItem('mock_saved_cases', JSON.stringify(localCases));
      }
    }

    setApplications(prev => prev.map(a => 
      a.id === appId 
        ? { ...a, sent: true, sentStatus, sentDate }
        : a
    ));
  };

  const filteredApplications = applications.filter(app => 
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
          Link Tracking
        </h1>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by Application No or Customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'transparent' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Application No</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Customer Name</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Mobile Number</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Link Status</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Sent Date</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Customer Upload</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      {app.id}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{app.customer}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.mobile || '—'}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {app.sent && app.sentStatus === 'failed' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c' }}>
                          <XCircle size={12} /> Sent Failed
                        </span>
                      ) : app.sent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d' }}>
                          <CheckCircle2 size={12} /> Sent Successfully
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {app.sentDate ? new Date(app.sentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {app.customerUploaded ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d' }}>
                          <CheckCircle2 size={12} /> Uploaded
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309' }}>
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {!app.sent && (
                        <button 
                          onClick={() => handleSendLink(app.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', backgroundColor: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <Send size={14} /> Send Link
                        </button>
                      )}
                      {app.sent && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/upload/${app.originalCase.mongoId || app.id}`);
                              toast.success('Upload link copied to clipboard!');
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            <LinkIcon size={14} /> Copy Link
                          </button>
                          <a
                            href={`/admin/applications/${app.id}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                          >
                            View
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No applications found.
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

export default LinkTracking;
