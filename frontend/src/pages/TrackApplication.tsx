import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, CheckCircle2, FileText, Calendar, Building2, MapPin, XCircle, Clock } from 'lucide-react';
import { getApplicationStatus } from '../utils/statusHelper';

interface StageConfig {
  key: string;
  label: string;
  description: string;
}

const STAGES: StageConfig[] = [
  { key: 'submitted',    label: 'Application Submitted',   description: 'Application registered and initial fees paid.' },
  { key: 'documents',    label: 'Document Collection',     description: 'Customer documents collected and under review.' },
  { key: 'verification', label: 'Document Verification',   description: 'Documents verified by the authority.' },
  { key: 'preparation',  label: 'Application Prepared',    description: 'Application package prepared for submission.' },
  { key: 'govt',         label: 'Government Submission',   description: 'Application submitted to government office.' },
  { key: 'inspection',   label: 'Site Inspection',         description: 'Site inspection conducted by officer.' },
  { key: 'govtverify',   label: 'Government Verification', description: 'File under review by planning officer.' },
  { key: 'approval',     label: 'Approval',                description: 'Final sign-off by authority.' },
];

const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  'New':                0,
  'Action Required':    1,
  'Documents Pending':  1,
  'Verification':       2,
  'Under Review':       3,
  'Submitted':          4,
  'Gov Verification':   5,
  'Site Inspection':    6,
  'Approved':           7,
  'Rejected':           -1,
};

const STATUS_COLORS: Record<string, string> = {
  'New':                '#94a3b8',
  'Action Required':    'var(--warning-gold)',
  'Documents Pending':  'var(--warning-gold)',
  'Verification':       'var(--primary)',
  'Under Review':       'var(--primary)',
  'Submitted':          'var(--info-green)',
  'Gov Verification':   'var(--primary-dark)',
  'Site Inspection':    'var(--warning-gold)',
  'Approved':           'var(--success-green)',
  'Rejected':           'var(--error-red)',
};

const DOC_LABELS: Record<string, string> = {
  aadhar:       'Aadhaar Card',
  pan:          'PAN Card',
  sale_deed:    'Sale Deed',
  tax_receipt:  'Tax Receipt',
  patta:        'Patta / Chitta',
  ec:           'Encumbrance Certificate',
};

const TrackApplication: React.FC = () => {
  const location = useLocation();
  const [appNumber, setAppNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [customerDocs, setCustomerDocs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    if (idParam) setAppNumber(idParam);
  }, [location]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appNumber.trim() || !mobileNumber.trim()) return;

    const stored = localStorage.getItem('recentApplications');
    const apps: any[] = stored ? JSON.parse(stored) : [];

    const found = apps.find(
      app => app.id.toLowerCase() === appNumber.trim().toLowerCase() &&
             app.mobile?.toString().replace(/\s/g, '') === mobileNumber.trim().replace(/\s/g, '')
    );

    if (found) {
      const liveStatus = getApplicationStatus(found.id, found.status);
      setAppData(found);
      setCurrentStatus(liveStatus);
      setIsTracking(true);
      setError('');

      // Load customer docs
      const docsStored = localStorage.getItem(`customerDocs_${found.id}`);
      if (docsStored) {
        const docs = JSON.parse(docsStored);
        setCustomerDocs(docs.filter((d: any) => Object.keys(DOC_LABELS).includes(d.id)));
      } else {
        setCustomerDocs([]);
      }
    } else {
      setIsTracking(false);
      setError('No application found. Please check your Application ID and mobile number.');
    }
  };

  const stageIndex = currentStatus === 'Rejected' ? -1 : (STATUS_TO_STAGE_INDEX[currentStatus] ?? 0);
  const isRejected = currentStatus === 'Rejected';
  const statusColor = STATUS_COLORS[currentStatus] || '#94a3b8';

  const getDocStatusColor = (status: string) => {
    if (status === 'Verified') return 'var(--success-green)';
    if (status === 'Needs Reupload') return 'var(--error-red)';
    if (status === 'Pending' || status === 'Missing') return 'var(--warning-gold)';
    return '#94a3b8';
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '4rem 0 2rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1 className="heading-2" style={{ marginBottom: '1rem' }}>Track Application Status</h1>
          <p className="text-lead" style={{ fontSize: '1rem' }}>
            Check the real-time status of your building approval application and view uploaded documents.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
        
        {/* Search Form */}
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '3rem' }}>
          <form onSubmit={handleTrack} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label className="form-label">Application Number</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. BA-2026-00129" 
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label className="form-label">Registered Mobile Number</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="Enter mobile number" 
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.875rem 2rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} /> Track
            </button>
          </form>
        </div>

        {error && (
          <div style={{ textAlign: 'center', color: 'var(--error-red)', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {isTracking && appData && (
          <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0', overflow: 'hidden' }}>
            
            {/* Header Banner */}
            <div style={{ backgroundColor: isRejected ? 'var(--error-red)' : 'var(--primary)', color: 'white', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>APPLICATION NUMBER</div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{appData.id}</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.25rem' }}>CURRENT STATUS</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', color: 'var(--primary-dark)', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }}></div>
                    {currentStatus}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
                
                {/* Details + Documents */}
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Application Details</h3>
                  
                  <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>APPLICANT NAME</div>
                      <div style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>{appData.customer}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>PROJECT TYPE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                        <Building2 size={16} /> {appData.appType}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>LOCATION</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                        <MapPin size={16} /> {appData.location}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>SUBMITTED DATE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                        <Calendar size={16} /> {appData.date}
                      </div>
                    </div>
                  </div>

                  {/* Customer Documents */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', marginTop: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Uploaded Documents</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {customerDocs.length > 0 ? customerDocs.map((doc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                          <FileText size={16} color="var(--primary)" />
                          {DOC_LABELS[doc.id] || doc.name || doc.id}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: getDocStatusColor(doc.status) }}>
                          {doc.status === 'Missing' ? 'Not Uploaded' : doc.status}
                        </span>
                      </div>
                    )) : (
                      <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                        No documents uploaded yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Timeline */}
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Application Progress</h3>
                  
                  {isRejected ? (
                    <div style={{ padding: '2rem', backgroundColor: '#fee2e2', borderRadius: '0.75rem', textAlign: 'center' }}>
                      <XCircle size={48} color="var(--error-red)" style={{ marginBottom: '1rem' }} />
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--error-red)', marginBottom: '0.5rem' }}>Application Rejected</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Your application has been rejected. Please contact our office for more details.
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                      {/* Vertical Line */}
                      <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '7px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                      
                      {STAGES.map((stage, index) => {
                        const isDone    = index < stageIndex;
                        const isCurrent = index === stageIndex;
                        const isPending = index > stageIndex;

                        return (
                          <div key={stage.key} style={{ position: 'relative', paddingBottom: '1.5rem', opacity: isPending ? 0.45 : 1, transition: 'opacity 0.3s' }}>
                            <div style={{ position: 'absolute', left: '-1.5rem', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                              {isDone ? (
                                <CheckCircle2 color="var(--success-green)" size={20} style={{ backgroundColor: 'white' }} />
                              ) : isCurrent ? (
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '4px solid var(--primary)', boxSizing: 'border-box', marginLeft: '2px' }}></div>
                              ) : (
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid var(--text-secondary)', boxSizing: 'border-box', marginLeft: '4px' }}></div>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, color: isCurrent ? 'var(--primary)' : isDone ? 'var(--primary-dark)' : 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {stage.label}
                              {isCurrent && <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(30, 58, 138, 0.05)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 700 }}>CURRENT</span>}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{stage.description}</div>
                            {isDone && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={12} /> Completed
                              </div>
                            )}
                            {isCurrent && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> In Progress
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TrackApplication;
