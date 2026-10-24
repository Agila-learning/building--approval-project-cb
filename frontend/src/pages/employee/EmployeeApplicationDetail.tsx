import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const EmployeeApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  const loadData = () => {
    const storedApps = localStorage.getItem('recentApplications');
    if (storedApps) {
      const apps = JSON.parse(storedApps);
      const app = apps.find((a: any) => a.id === id);
      setApplication(app);
    }

    const storedDocs = localStorage.getItem(`customerDocs_${id}`);
    if (storedDocs) {
      setDocuments(JSON.parse(storedDocs));
    } else {
      setDocuments([
        { id: 'aadhar', name: 'Aadhar Card', status: 'Missing', file: null },
        { id: 'tax_receipt', name: 'Property Tax Receipt', status: 'Missing', file: null },
      ]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [id]);

  const handleApplicationStatus = (newStatus: string) => {
    if (application) {
      const storedApps = localStorage.getItem('recentApplications');
      if (storedApps) {
        const apps = JSON.parse(storedApps);
        const updatedApps = apps.map((a: any) => a.id === id ? { ...a, status: newStatus } : a);
        localStorage.setItem('recentApplications', JSON.stringify(updatedApps));
        window.dispatchEvent(new Event('storage'));
        loadData();
      }
    }
  };

  const handleDocumentAction = (docId: string, action: 'Verified' | 'Rejected' | 'Needs Reupload') => {
    const updatedDocs = documents.map(d => d.id === docId ? { ...d, status: action } : d);
    setDocuments(updatedDocs);
    localStorage.setItem(`customerDocs_${id}`, JSON.stringify(updatedDocs));
    window.dispatchEvent(new Event('storage'));
  };

  if (!application) return <div style={{ padding: '2rem' }}>Loading application...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/employee/applications')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}>
          <ArrowLeft size={20} color="var(--primary-dark)" />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Application {application.id}
            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: application.status === 'Approved' ? 'rgba(47, 125, 90, 0.1)' : 'rgba(30, 58, 138, 0.05)', color: application.status === 'Approved' ? 'var(--success-green)' : 'var(--primary)', verticalAlign: 'middle' }}>
              {application.status}
            </span>
          </h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Customer: {application.customer}</div>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <button className="btn-primary" onClick={() => handleApplicationStatus('Verification')} disabled={application.status === 'Verification' || application.status === 'Approved'}>
          Start Processing
        </button>
        <button className="btn-secondary" onClick={() => handleApplicationStatus('Documents Pending')}>
          Request Information
        </button>
        <button className="btn-secondary">
          Add Note
        </button>
        <button className="btn-secondary">
          Upload Document
        </button>
        <div style={{ flex: 1 }}></div>
        <button 
          onClick={() => handleApplicationStatus('Approved')}
          disabled={application.status === 'Approved'}
          style={{ padding: '0.5rem 1.5rem', borderRadius: '0.375rem', fontWeight: 600, cursor: application.status === 'Approved' ? 'not-allowed' : 'pointer', backgroundColor: application.status === 'Approved' ? '#e2e8f0' : 'var(--success-green)', color: application.status === 'Approved' ? '#94a3b8' : 'white', border: 'none', transition: 'all 0.2s' }}
        >
          {application.status === 'Approved' ? 'Application Approved' : 'Approve Application'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Application Overview */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Application Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>APPLICATION NUMBER</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{application.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>CUSTOMER NAME</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{application.customer}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>APPLICATION TYPE</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{application.appType || 'Residential'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>PROPERTY LOCATION</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{application.location}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>DATE SUBMITTED</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{application.date}</div>
              </div>
            </div>
          </div>

          {/* Document Section */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Document Verification</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Review and verify customer documents.</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Document</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length > 0 ? documents.map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>{doc.name}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          backgroundColor: doc.status === 'Verified' ? 'rgba(47, 125, 90, 0.1)' : doc.status === 'Rejected' || doc.status === 'Needs Reupload' ? 'rgba(185, 74, 72, 0.1)' : 'rgba(214, 167, 86, 0.1)', 
                          color: doc.status === 'Verified' ? 'var(--success-green)' : doc.status === 'Rejected' || doc.status === 'Needs Reupload' ? 'var(--error-red)' : 'var(--accent)' 
                        }}>
                          {doc.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>View</button>
                          {doc.status !== 'Verified' && (
                            <button onClick={() => handleDocumentAction(doc.id, 'Verified')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--success-green)', color: 'var(--success-green)', backgroundColor: 'transparent', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Verify</button>
                          )}
                          {doc.status !== 'Needs Reupload' && (
                            <button onClick={() => handleDocumentAction(doc.id, 'Needs Reupload')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--error-red)', color: 'var(--error-red)', backgroundColor: 'transparent', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }}>No documents uploaded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Workflow Status */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Application Progress</h3>
            
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
              
              {[
                { label: 'Application Created', done: true },
                { label: 'Documents Uploaded', done: true },
                { label: 'Document Verification', active: application.status === 'Verification', done: application.status === 'Approved' },
                { label: 'Approval Processing', active: application.status === 'Approved', done: application.status === 'Approved' },
              ].map((step, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-1.5rem', 
                    width: '14px', 
                    height: '14px', 
                    borderRadius: '50%', 
                    backgroundColor: step.done ? 'var(--success-green)' : step.active ? 'var(--primary)' : 'var(--border-color)',
                    border: '3px solid var(--bg-surface)',
                    boxShadow: '0 0 0 1px var(--border-color)',
                    transform: 'translateX(-1px)'
                  }}></div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: step.active ? 700 : 500, 
                    color: step.active ? 'var(--primary)' : step.done ? 'var(--primary-dark)' : 'var(--text-secondary)'
                  }}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeApplicationDetail;
