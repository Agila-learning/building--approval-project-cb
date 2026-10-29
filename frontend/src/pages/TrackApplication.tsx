import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, CheckCircle2, FileText, Calendar, Building2, MapPin, XCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface StageConfig {
  key: string;
  label: string;
  description: string;
}

const STAGES: StageConfig[] = [
  { key: 'submitted',    label: 'Application Submitted',   description: 'Application registered and initial details submitted.' },
  { key: 'documents',    label: 'Document Collection',     description: 'Applicant documents received and queued for review.' },
  { key: 'verification', label: 'Document Verification',   description: 'Identity, ownership, and plan documents verified.' },
  { key: 'preparation',  label: 'Application Prepared',    description: 'Application dossier compiled for municipal filing.' },
  { key: 'govt',         label: 'Government Submission',   description: 'Application forwarded to municipal planning portal.' },
  { key: 'inspection',   label: 'Site Inspection',         description: 'Field officer inspection and geo-verification.' },
  { key: 'govtverify',   label: 'Government Scrutiny',     description: 'Final planning authority technical scrutiny.' },
  { key: 'approval',     label: 'Final Approval',          description: 'Official building plan approval order sanctioned.' },
];

const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  'New':                    0,
  'DOCUMENTS_PENDING':      1,
  'Documents Pending':      1,
  'Action Required':        1,
  'ACTION_NEEDED':          1,
  'INTAKE':                 1,
  'DOCUMENTS_VERIFICATION': 2,
  'Verification':           2,
  'DOCUMENTS_VERIFIED':     2,
  'Under Review':           3,
  'APPLICATION_PREP':       3,
  'SUBMITTED_FOR_APPROVAL': 4,
  'Submitted':              4,
  'SUBMITTED':              4,
  'Gov Verification':       5,
  'SCRUTINY':               5,
  'Site Inspection':        6,
  'INSPECTION_SCHEDULED':   6,
  'INSPECTION_DONE':        6,
  'Approved':               7,
  'APPROVED':               7,
  'Rejected':               -1,
  'REJECTED':               -1,
};

const STATUS_COLORS: Record<string, string> = {
  'New':                    '#94a3b8',
  'DOCUMENTS_PENDING':      'var(--warning-gold)',
  'Documents Pending':      'var(--warning-gold)',
  'Action Required':        'var(--warning-gold)',
  'ACTION_NEEDED':          'var(--warning-gold)',
  'INTAKE':                 'var(--warning-gold)',
  'DOCUMENTS_VERIFICATION': 'var(--primary)',
  'Verification':           'var(--primary)',
  'DOCUMENTS_VERIFIED':     'var(--info-green)',
  'Under Review':           'var(--primary)',
  'APPLICATION_PREP':       'var(--primary)',
  'Submitted':              'var(--info-green)',
  'SUBMITTED':              'var(--info-green)',
  'SUBMITTED_FOR_APPROVAL': 'var(--info-green)',
  'Gov Verification':       'var(--primary-dark)',
  'SCRUTINY':               'var(--primary-dark)',
  'Site Inspection':        'var(--warning-gold)',
  'INSPECTION_SCHEDULED':   'var(--warning-gold)',
  'INSPECTION_DONE':        'var(--warning-gold)',
  'Approved':               'var(--success-green)',
  'APPROVED':               'var(--success-green)',
  'Rejected':               'var(--error-red)',
  'REJECTED':               'var(--error-red)',
};

const STANDARD_DOCS = [
  { key: 'CUSTOMER PHOTOGRAPH', label: 'Applicant Photograph' },
  { key: 'CUSTOMER SIGNATURE', label: 'Applicant Signature' },
  { key: 'AADHAR CARD', label: 'Aadhaar Card' },
  { key: 'PAN CARD', label: 'PAN Card' },
  { key: 'SALE DEED', label: 'Sale Deed / Land Document' },
  { key: 'PATTA', label: 'Patta / Chitta' },
  { key: 'FMB', label: 'FMB Sketch' },
  { key: 'BUILDING PLAN', label: 'Building Plan / Layout' },
];

const TrackApplication: React.FC = () => {
  const location = useLocation();
  const [appNumber, setAppNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [liveDocs, setLiveDocs] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    const mobileParam = params.get('mobile');
    if (idParam) setAppNumber(idParam);
    if (mobileParam) setMobileNumber(mobileParam.replace(/\D/g, '').slice(0, 10));
  }, [location]);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanAppNum = appNumber.trim().replace(/^app-/i, '');
    const cleanMobile = mobileNumber.trim().replace(/\D/g, '').slice(-10);

    if (!cleanAppNum) {
      setError('Please enter your Application Reference Number.');
      return;
    }

    // STRICT MOBILE VALIDATION: exactly 10 digits starting with 6, 7, 8, or 9
    if (!cleanMobile) {
      setError('Please enter your registered 10-digit mobile number.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    setIsLoading(true);

    try {
      let foundCase: any = null;

      // 1. Fetch live case from backend MongoDB
      try {
        const res = await fetch(`${getApiUrl()}/cases/${encodeURIComponent(cleanAppNum)}`);
        if (res.ok) {
          foundCase = await res.json();
        } else {
          // Retry with APP- prefix if not found
          const res2 = await fetch(`${getApiUrl()}/cases/APP-${encodeURIComponent(cleanAppNum)}`);
          if (res2.ok) foundCase = await res2.json();
        }
      } catch (apiErr) {
        console.warn('Backend API connection warning, checking cache:', apiErr);
      }

      // 2. Fallback to localStorage if API unavailable
      if (!foundCase) {
        const stored = localStorage.getItem('recentApplications');
        const apps: any[] = stored ? JSON.parse(stored) : [];
        const savedCasesStr = localStorage.getItem('mock_saved_cases');
        const savedCases: any[] = savedCasesStr ? JSON.parse(savedCasesStr) : [];
        const allApps = [...apps, ...savedCases];

        foundCase = allApps.find((c: any) => {
          const cId = (c.id || c.application_number || '').toString().toLowerCase().replace(/^app-/, '');
          return cId === cleanAppNum.toLowerCase();
        });
      }

      if (!foundCase) {
        setIsTracking(false);
        setError('No application found with Reference Number: ' + appNumber + '. Please verify your details.');
        setIsLoading(false);
        return;
      }

      // 3. Verify registered mobile number
      const ownerPhone = (
        foundCase.property?.owner_phone ||
        foundCase.mobile ||
        foundCase.fullData?.mobile ||
        ''
      ).toString().replace(/\D/g, '').slice(-10);

      if (ownerPhone && ownerPhone !== cleanMobile) {
        setIsTracking(false);
        setError('Registered mobile number does not match this Application ID. Please enter the mobile number used during submission.');
        setIsLoading(false);
        return;
      }

      // 4. Calculate live, real documents from MongoDB case
      const uploadedFiles = foundCase.uploadedFiles || {};
      const caseDocuments: any[] = Array.isArray(foundCase.documents) ? foundCase.documents : [];
      const requestedReuploads: string[] = Array.isArray(foundCase.requestedReuploads) ? foundCase.requestedReuploads : [];
      const isCaseApproved = foundCase.status === 'APPROVED' || foundCase.status === 'Approved';
      const isCaseVerified = isCaseApproved || foundCase.status === 'DOCUMENTS_VERIFIED';

      const compiledDocs = STANDARD_DOCS.map(doc => {
        // Find in uploadedFiles
        let fileUrl = uploadedFiles[doc.key] || uploadedFiles[doc.label];
        // Also check database Document records
        const dbDoc = caseDocuments.find((d: any) => 
          (d.document_type || '').toUpperCase() === doc.key.toUpperCase() ||
          (d.document_type || '').toUpperCase() === doc.label.toUpperCase()
        );
        if (dbDoc && dbDoc.file_key) fileUrl = dbDoc.file_key;

        // Check if reupload was specifically requested
        const needsReupload = requestedReuploads.includes(doc.key) || (dbDoc && dbDoc.status === 'REJECTED');

        let status = 'Pending Upload';
        if (fileUrl) {
          if (needsReupload) {
            status = 'Needs Reupload';
          } else if (isCaseVerified || (dbDoc && dbDoc.verified)) {
            status = 'Verified';
          } else {
            status = 'Uploaded & Under Review';
          }
        }

        return {
          id: doc.key,
          name: doc.label,
          status,
          fileUrl: typeof fileUrl === 'string' && fileUrl.startsWith('http') ? fileUrl : null
        };
      });

      setLiveDocs(compiledDocs);
      setAppData(foundCase);
      setCurrentStatus(foundCase.status || 'DOCUMENTS_PENDING');
      setIsTracking(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while tracking your application.');
    } finally {
      setIsLoading(false);
    }
  };

  const stageIndex = (currentStatus === 'Rejected' || currentStatus === 'REJECTED') 
    ? -1 
    : (STATUS_TO_STAGE_INDEX[currentStatus] ?? 1);
  const isRejected = currentStatus === 'Rejected' || currentStatus === 'REJECTED';
  const statusColor = STATUS_COLORS[currentStatus] || '#94a3b8';

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return { color: '#047857', bg: '#d1fae5', text: 'Verified' };
      case 'Needs Reupload':
        return { color: '#b91c1c', bg: '#fee2e2', text: 'Needs Reupload' };
      case 'Uploaded & Under Review':
        return { color: '#0369a1', bg: '#e0f2fe', text: 'Under Review' };
      default:
        return { color: '#b45309', bg: '#fef3c7', text: 'Pending' };
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '4rem 0 2rem 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h1 className="heading-2" style={{ marginBottom: '1rem' }}>Track Application Status</h1>
          <p className="text-lead" style={{ fontSize: '1rem' }}>
            Check real-time municipal approval progress and verified document status for your property.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
        
        {/* Search Form */}
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '3rem' }}>
          <form onSubmit={handleTrack} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label className="form-label">Application Reference Number *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 7001 or APP-7001" 
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
              <label className="form-label">Registered Mobile Number (10 Digits) *</label>
              <input 
                type="tel" 
                maxLength={10}
                className="form-input" 
                placeholder="Starts with 6, 7, 8, 9" 
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Must be 10 digits starting with 6, 7, 8, or 9
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary" 
              style={{ padding: '0.875rem 2rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} 
              {isLoading ? 'Checking...' : 'Track'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ textAlign: 'center', color: 'var(--error-red)', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', maxWidth: '800px', margin: '0 auto 2rem', border: '1px solid #fca5a5', fontWeight: 500 }}>
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
                  <div style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>APPLICATION REFERENCE</div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
                    {appData.application_number ? (appData.application_number.startsWith('APP-') ? appData.application_number : `APP-${appData.application_number}`) : appData.id}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.85, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>LIVE STATUS</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', color: 'var(--primary-dark)', padding: '0.5rem 1.25rem', borderRadius: '2rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor }}></div>
                    {currentStatus.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                
                {/* Details + Real Documents */}
                <div style={{ flex: '1 1 340px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>Application Details</h3>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>APPLICANT NAME</div>
                      <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem' }}>
                        {appData.property?.owner_name || appData.fullData?.customerName || appData.applicantName || 'Applicant'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>APPROVAL TYPE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                        <Building2 size={16} color="var(--primary)" /> 
                        {(appData.approval_type || appData.serviceType || 'BUILDING_PLAN_APPROVAL').replace(/_/g, ' ')}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>PROPERTY LOCATION</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                        <MapPin size={16} color="var(--primary)" /> 
                        {appData.property?.address || appData.property?.village || appData.location || 'Coimbatore, Tamil Nadu'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>SUBMISSION DATE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                        <Calendar size={16} color="var(--primary)" /> 
                        {appData.created_at ? new Date(appData.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (appData.date || 'Today')}
                      </div>
                    </div>
                  </div>

                  {/* Real Live Documents */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', marginTop: '2.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    Document Verification Status
                  </h3>
                  <div style={{ display: 'grid', gap: '0.625rem' }}>
                    {liveDocs.map((doc, i) => {
                      const badge = getDocStatusBadge(doc.status);
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
                            <FileText size={16} color="var(--primary)" />
                            <span>{doc.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: badge.color, 
                              backgroundColor: badge.bg, 
                              padding: '0.2rem 0.6rem', 
                              borderRadius: '1rem' 
                            }}>
                              {badge.text}
                            </span>
                            {doc.fileUrl && (
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title="View uploaded file"
                                style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', padding: '0.2rem' }}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Timeline */}
                <div style={{ flex: '1 1 340px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>Approval Milestones</h3>
                  
                  {isRejected ? (
                    <div style={{ padding: '2rem', backgroundColor: '#fee2e2', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid #fca5a5' }}>
                      <XCircle size={48} color="var(--error-red)" style={{ marginBottom: '1rem' }} />
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--error-red)', marginBottom: '0.5rem' }}>Application Rejected</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Your application was not approved during technical scrutiny. Please contact our liaison officer for rectification guidance.
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
                      {/* Vertical Progress Line */}
                      <div style={{ position: 'absolute', top: '12px', bottom: '20px', left: '8px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                      
                      {STAGES.map((stage, index) => {
                        const isDone    = index < stageIndex;
                        const isCurrent = index === stageIndex;
                        const isPending = index > stageIndex;

                        return (
                          <div key={stage.key} style={{ position: 'relative', paddingBottom: '1.5rem', opacity: isPending ? 0.45 : 1, transition: 'opacity 0.3s' }}>
                            <div style={{ position: 'absolute', left: '-1.75rem', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                              {isDone ? (
                                <CheckCircle2 color="var(--success-green)" size={20} style={{ backgroundColor: 'white' }} />
                              ) : isCurrent ? (
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '4px solid var(--primary)', backgroundColor: 'white', boxSizing: 'border-box' }}></div>
                              ) : (
                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--text-secondary)', backgroundColor: 'white', boxSizing: 'border-box', marginLeft: '2px' }}></div>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, color: isCurrent ? 'var(--primary)' : isDone ? 'var(--primary-dark)' : 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {stage.label}
                              {isCurrent && <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(30, 58, 138, 0.08)', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '1rem', fontWeight: 700 }}>CURRENT STEP</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{stage.description}</div>
                            {isDone && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--success-green)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <CheckCircle2 size={12} /> Completed
                              </div>
                            )}
                            {isCurrent && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
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
