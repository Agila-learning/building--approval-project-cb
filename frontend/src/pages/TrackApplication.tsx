import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Search, CheckCircle2, FileText, Calendar, Building2, MapPin, 
  XCircle, Clock, ExternalLink, Loader2, AlertTriangle, UserCheck,
  CreditCard, Eye, ShieldCheck, Phone, Mail, HelpCircle, ArrowRight
} from 'lucide-react';
import { getApiUrl } from '../config/api';

export interface StageItem {
  name: string;
  key: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  startedDate?: string | null;
  completedDate?: string | null;
  remarks?: string;
  responsiblePerson?: string;
  description?: string;
}

const OFFICIAL_STAGES: { key: string; name: string; description: string }[] = [
  { key: 'stage_submitted', name: 'Application Submitted', description: 'Application registered and initial details submitted.' },
  { key: 'stage_doc_verification', name: 'Document Verification', description: 'Identity, ownership, and building plan documents scrutiny.' },
  { key: 'stage_payment', name: 'Payment Process', description: 'Municipal and scrutiny fee processing and clearance.' },
  { key: 'stage_site_visit', name: 'Site Visit', description: 'Field officer inspection and geo-verification of the property site.' },
  { key: 'stage_final_review', name: 'Final Review', description: 'Final planning authority technical scrutiny and report compilation.' },
  { key: 'stage_completed', name: 'Application Completed', description: 'Official building plan approval order sanctioned and dispatched.' },
];

const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  'DRAFT': 0,
  'NEW': 0,
  'APPLICATION SUBMITTED': 0,
  'SUBMITTED': 0,
  'INTAKE': 0,
  'DOCUMENT VERIFICATION': 1,
  'DOCUMENTS_VERIFICATION': 1,
  'DOCUMENTS_PENDING': 1,
  'DOCUMENTS PENDING': 1,
  'DOCUMENTS_VERIFIED': 1,
  'DOCUMENTS VERIFIED': 1,
  'ACTION REQUIRED': 1,
  'ACTION_NEEDED': 1,
  'UNDER REVIEW': 1,
  'PAYMENT PROCESS': 2,
  'PAYMENT_PENDING': 2,
  'PAYMENT_COMPLETED': 2,
  'SITE VISIT': 3,
  'SITE_VISIT': 3,
  'INSPECTION_SCHEDULED': 3,
  'INSPECTION_DONE': 3,
  'FINAL REVIEW': 4,
  'FINAL_REVIEW': 4,
  'SCRUTINY': 4,
  'APPLICATION PREPARED': 4,
  'APPLICATION_PREP': 4,
  'GOVT_SUBMISSION': 4,
  'APPLICATION COMPLETED': 5,
  'APPROVED': 5,
  'FINAL APPROVAL': 5,
  'SANCTIONED': 5,
  'CLOSED': 5,
  'REJECTED': -1,
  'REJECT': -1
};

const STANDARD_DOCS = [
  { key: 'CUSTOMER PHOTOGRAPH', label: 'Applicant Photograph' },
  { key: 'CUSTOMER SIGNATURE', label: 'Applicant Signature' },
  { key: 'AADHAR CARD', label: 'Aadhaar Card' },
  { key: 'PAN CARD', label: 'PAN Card' },
  { key: 'SALE DEED', altKey: 'LAND DOCUMENT', label: 'Sale Deed / Land Document' },
  { key: 'PATTA', label: 'Patta / Chitta' },
  { key: 'BUILDING PLAN', label: 'Building Plan / Layout' },
];

export const getLocationDisplay = (caseData: any): string => {
  if (!caseData) return 'Not Provided';

  const prop = caseData.property || {};
  const pd = caseData.fullData?.propertyDetails || {};
  const rd = caseData.fullData?.residentialAddress || {};

  if (prop.address && typeof prop.address === 'string') {
    const cleanAddr = prop.address.trim();
    if (cleanAddr && !cleanAddr.toLowerCase().includes('unknown') && cleanAddr !== 'Coimbatore, Tamil Nadu') {
      return cleanAddr;
    }
  }

  const propParts = [
    pd.village || pd.panchayat || prop.village,
    pd.taluk || prop.taluk,
    pd.city,
    pd.district || prop.district,
    pd.pincode ? `PIN: ${pd.pincode}` : ''
  ].filter(p => Boolean(p) && p !== 'Unknown' && p !== 'TBD');

  if (propParts.length > 0) return propParts.join(', ');

  const resParts = [
    rd.houseNo ? `D.No ${rd.houseNo}` : (rd.dno ? `D.No ${rd.dno}` : ''),
    rd.streetName || rd.street,
    rd.area,
    rd.village || rd.city,
    rd.taluk,
    rd.district,
    rd.pincode ? `PIN: ${rd.pincode}` : ''
  ].filter(p => Boolean(p) && p !== 'Unknown' && p !== 'TBD');

  if (resParts.length > 0) return resParts.join(', ');

  if (prop.village && prop.village !== 'Unknown' && prop.village !== 'TBD') {
    return `${prop.village}${prop.taluk && prop.taluk !== 'TBD' ? ', ' + prop.taluk : ''}`;
  }

  if (caseData.location && typeof caseData.location === 'string' && caseData.location !== 'Coimbatore, Tamil Nadu') {
    return caseData.location;
  }

  return 'Tamil Nadu';
};

export const getSubmissionDateDisplay = (caseData: any): string => {
  if (!caseData) return 'N/A';

  const rawDate = 
    caseData.created_at || 
    caseData.createdAt || 
    caseData.submittedAt || 
    caseData.fullData?.createdAt || 
    caseData.fullData?.submittedAt || 
    caseData.submittedDate || 
    caseData.date;

  if (!rawDate) return 'N/A';

  if (typeof rawDate === 'string') {
    const match = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const y = parseInt(match[3], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return rawDate;
  }

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return 'N/A';
};

const formatDateNice = (dStr?: string | null) => {
  if (!dStr) return null;
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dStr;
  }
};

const TrackApplication: React.FC = () => {
  const location = useLocation();
  const [appNumber, setAppNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [liveDocs, setLiveDocs] = useState<any[]>([]);
  const [stagesList, setStagesList] = useState<StageItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id') || params.get('ref') || params.get('app');
    const mobileParam = params.get('mobile') || params.get('phone');
    if (idParam) setAppNumber(idParam);
    if (mobileParam) setMobileNumber(mobileParam.replace(/\D/g, '').slice(0, 10));

    if (idParam && mobileParam && mobileParam.replace(/\D/g, '').length >= 10) {
      handleTrack(undefined, idParam, mobileParam.replace(/\D/g, '').slice(-10));
    }
  }, [location]);

  const handleTrack = async (e?: React.FormEvent, overrideApp?: string, overrideMobile?: string) => {
    if (e) e.preventDefault();
    setError('');

    const targetApp = (overrideApp !== undefined ? overrideApp : appNumber).trim();
    const targetMobile = (overrideMobile !== undefined ? overrideMobile : mobileNumber).trim();

    const cleanAppNum = targetApp.replace(/^app-/i, '');
    const cleanMobile = targetMobile.replace(/\D/g, '').slice(-10);

    if (!cleanAppNum) {
      setError('Please enter your Application Reference Number.');
      return;
    }

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
        foundCase.fullData?.phone ||
        ''
      ).toString().replace(/\D/g, '').slice(-10);

      if (ownerPhone && ownerPhone !== cleanMobile) {
        setIsTracking(false);
        setError('Registered mobile number does not match this Application ID. Please enter the mobile number used during submission.');
        setIsLoading(false);
        return;
      }

      // 4. Calculate live documents from MongoDB case
      const uploadedFiles = foundCase.uploadedFiles || {};
      const caseDocuments: any[] = Array.isArray(foundCase.documents) ? foundCase.documents : [];
      const requestedReuploads: string[] = Array.isArray(foundCase.requestedReuploads) ? foundCase.requestedReuploads : [];
      const isCaseApproved = foundCase.status === 'APPROVED' || foundCase.status === 'Approved' || foundCase.status === 'Application Completed';
      const isCaseVerified = isCaseApproved || foundCase.status === 'DOCUMENTS_VERIFIED' || foundCase.status === 'Documents Verified';

      const compiledDocs = STANDARD_DOCS.map(doc => {
        let fileUrl = uploadedFiles[doc.key] || uploadedFiles[doc.label] || (doc.altKey ? uploadedFiles[doc.altKey] : null);
        const dbDoc = caseDocuments.find((d: any) => 
          (d.document_type || '').toUpperCase() === doc.key.toUpperCase() ||
          (d.document_type || '').toUpperCase() === doc.label.toUpperCase() ||
          (doc.altKey && (d.document_type || '').toUpperCase() === doc.altKey.toUpperCase())
        );
        if (dbDoc && dbDoc.file_key) fileUrl = dbDoc.file_key;

        const needsReupload = requestedReuploads.includes(doc.key) || (dbDoc && dbDoc.status === 'REJECTED');
        const isVerified = isCaseVerified || (dbDoc && (dbDoc.verified || dbDoc.status === 'Verified' || dbDoc.status === 'VERIFIED'));

        let status = 'Pending Upload';
        let reason = dbDoc?.review_notes || '';

        if (fileUrl) {
          if (needsReupload) {
            status = 'Needs Reupload';
          } else if (isVerified) {
            status = 'Verified';
          } else {
            status = 'Uploaded & Under Review';
          }
        }

        return {
          id: doc.key,
          name: doc.label,
          status,
          reason,
          fileUrl: typeof fileUrl === 'string' && fileUrl.startsWith('http') ? fileUrl : null
        };
      });

      // 5. Build Stage-Wise Progress from database or defaults
      const rawStages = foundCase.fullData?.stages || foundCase.stages;
      const statusUpper = (foundCase.status || 'Application Submitted').toUpperCase();
      const currentActiveIndex = STATUS_TO_STAGE_INDEX[statusUpper] !== undefined ? STATUS_TO_STAGE_INDEX[statusUpper] : 0;

      let finalStages: StageItem[] = [];

      if (Array.isArray(rawStages) && rawStages.length === 6) {
        finalStages = rawStages.map((st: any, idx: number) => {
          const config = OFFICIAL_STAGES[idx] || { key: `stage_${idx}`, name: st.name, description: '' };
          return {
            name: st.name || config.name,
            key: st.key || config.key,
            status: st.status || (idx < currentActiveIndex ? 'Completed' : idx === currentActiveIndex ? 'In Progress' : 'Pending'),
            startedDate: st.startedDate || (idx <= currentActiveIndex ? (foundCase.created_at || new Date().toISOString()) : null),
            completedDate: st.completedDate || (idx < currentActiveIndex ? (foundCase.created_at || new Date().toISOString()) : null),
            remarks: st.remarks || (idx === 0 ? 'Application registered and initial details submitted.' : ''),
            responsiblePerson: st.responsiblePerson || (idx === 0 ? 'Customer' : (foundCase.assigned_staff?.name || (foundCase.fullData as any)?.staff || 'CB Construction Team')),
            description: config.description
          };
        });
      } else {
        finalStages = OFFICIAL_STAGES.map((cfg, idx) => {
          let stageStatus: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
          if (statusUpper === 'APPLICATION COMPLETED' || statusUpper === 'APPROVED') {
            stageStatus = 'Completed';
          } else if (idx < currentActiveIndex) {
            stageStatus = 'Completed';
          } else if (idx === currentActiveIndex) {
            stageStatus = 'In Progress';
          }

          return {
            name: cfg.name,
            key: cfg.key,
            status: stageStatus,
            startedDate: idx <= currentActiveIndex ? (foundCase.created_at || new Date().toISOString()) : null,
            completedDate: idx < currentActiveIndex ? (foundCase.created_at || new Date().toISOString()) : null,
            remarks: idx === 0 ? 'Application registered and initial details submitted.' : '',
            responsiblePerson: idx === 0 ? 'Customer' : (foundCase.assigned_staff?.name || (foundCase.fullData as any)?.staff || 'CB Construction Team'),
            description: cfg.description
          };
        });
      }

      setLiveDocs(compiledDocs);
      setStagesList(finalStages);
      setAppData(foundCase);
      setCurrentStatus(foundCase.status || 'Application Submitted');
      setIsTracking(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while tracking your application.');
    } finally {
      setIsLoading(false);
    }
  };

  const isRejected = (currentStatus || '').toUpperCase() === 'REJECTED';
  const hasReuploadRequired = liveDocs.some(d => d.status === 'Needs Reupload');
  const reuploadDocs = liveDocs.filter(d => d.status === 'Needs Reupload');

  const assignedWorkerName = 
    appData?.assigned_staff?.name || 
    (appData?.fullData?.staff && appData.fullData.staff !== 'Unassigned' ? appData.fullData.staff : null) || 
    (appData?.staff && appData.staff !== 'Unassigned' ? appData.staff : null);

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return { color: '#047857', bg: '#d1fae5', text: 'Verified' };
      case 'Needs Reupload':
        return { color: '#b91c1c', bg: '#fee2e2', text: 'Re-upload Required' };
      case 'Uploaded & Under Review':
        return { color: '#0369a1', bg: '#e0f2fe', text: 'Under Review' };
      default:
        return { color: '#b45309', bg: '#fef3c7', text: 'Pending Upload' };
    }
  };

  return (
    <div style={{ paddingBottom: '4rem', minHeight: '80vh', backgroundColor: 'var(--bg-main, #f8fafc)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--primary, #1e3a8a)', color: '#ffffff', padding: '3.5rem 1rem 3rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Track Application Status
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, margin: 0 }}>
            Real-time municipal building approval progress, stage-wise tracking, and document verification status.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-2rem', position: 'relative', zIndex: 10, maxWidth: '1150px', margin: '-2rem auto 0 auto', padding: '0 1rem' }}>
        
        {/* Search Form Card */}
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto 2.5rem auto', padding: '1.75rem', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <form onSubmit={handleTrack} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 260px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)', marginBottom: '0.5rem' }}>
                Application Reference Number *
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 1001 or APP-1001" 
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.95rem' }}
              />
            </div>
            <div style={{ flex: '1 1 260px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)', marginBottom: '0.5rem' }}>
                Registered Mobile Number (10 Digits) *
              </label>
              <input 
                type="tel" 
                maxLength={10}
                className="form-input" 
                placeholder="Starts with 6, 7, 8, 9" 
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1.5px solid var(--border-color, #cbd5e1)', fontSize: '0.95rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.35rem' }}>
                Must be 10 digits starting with 6, 7, 8, or 9
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary" 
              style={{ 
                padding: '0.8rem 2.25rem', 
                whiteSpace: 'nowrap', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem', 
                borderRadius: '0.5rem',
                backgroundColor: 'var(--primary, #1e3a8a)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                border: 'none',
                minHeight: '48px'
              }}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} 
              {isLoading ? 'Checking...' : 'Track Application'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ textAlign: 'center', color: '#b91c1c', marginBottom: '2rem', padding: '1rem 1.5rem', backgroundColor: '#fee2e2', borderRadius: '0.75rem', maxWidth: '850px', margin: '0 auto 2rem auto', border: '1px solid #fca5a5', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#b91c1c" />
            <span>{error}</span>
          </div>
        )}

        {/* Tracking Results */}
        {isTracking && appData && (
          <div className="card" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0', overflow: 'hidden', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)', backgroundColor: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
            
            {/* Header Banner */}
            <div style={{ 
              backgroundColor: isRejected ? '#dc2626' : 'var(--primary, #1e3a8a)', 
              color: 'white', 
              padding: '1.75rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.25rem' }}>
                  PROPOSAL REFERENCE
                </div>
                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                  {appData.application_number ? (appData.application_number.startsWith('APP-') ? appData.application_number : `APP-${appData.application_number}`) : appData.id}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.35rem' }}>
                  CURRENT STATUS
                </div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  backgroundColor: 'white', 
                  color: isRejected ? '#dc2626' : 'var(--primary, #1e3a8a)', 
                  padding: '0.45rem 1.25rem', 
                  borderRadius: '2rem', 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isRejected ? '#dc2626' : '#10b981' }}></div>
                  {currentStatus.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {/* Re-upload Alert Box if needed */}
            {hasReuploadRequired && (
              <div style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertTriangle size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                      Action Required: Document Re-upload Requested
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: 1.4 }}>
                      The reviewer has requested updated documents: {reuploadDocs.map(d => d.name).join(', ')}. Please re-upload to proceed with verification.
                    </div>
                  </div>
                </div>
                <Link 
                  to={`/upload/${appData.application_number || appData.id}`}
                  style={{ 
                    backgroundColor: '#d97706', 
                    color: '#ffffff', 
                    padding: '0.55rem 1.25rem', 
                    borderRadius: '0.5rem', 
                    fontWeight: 600, 
                    fontSize: '0.875rem', 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  Re-upload Now <ArrowRight size={16} />
                </Link>
              </div>
            )}

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                
                {/* LEFT COLUMN: Customer Info + Documents */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color, #e2e8f0)', paddingBottom: '0.6rem' }}>
                    Application Information
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '0.875rem' }}>
                    <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderRadius: '0.625rem', border: '1px solid var(--border-color, #f1f5f9)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                        APPLICANT NAME
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: '1.05rem' }}>
                        {appData.property?.owner_name || appData.fullData?.customerName || appData.applicantName || 'Applicant'}
                      </div>
                    </div>

                    <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderRadius: '0.625rem', border: '1px solid var(--border-color, #f1f5f9)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                        PRODUCT / APPROVAL TYPE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        <Building2 size={16} color="var(--primary, #1e3a8a)" /> 
                        {(appData.approval_type || appData.serviceType || 'Building Plan Approval').replace(/_/g, ' ')}
                      </div>
                    </div>

                    <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderRadius: '0.625rem', border: '1px solid var(--border-color, #f1f5f9)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                        PROPERTY LOCATION
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)', fontSize: '0.92rem' }}>
                        <MapPin size={16} color="var(--primary, #1e3a8a)" style={{ flexShrink: 0 }} /> 
                        <span>{getLocationDisplay(appData)}</span>
                      </div>
                    </div>

                    <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderRadius: '0.625rem', border: '1px solid var(--border-color, #f1f5f9)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                        SUBMISSION DATE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                        <Calendar size={16} color="var(--primary, #1e3a8a)" /> 
                        {getSubmissionDateDisplay(appData)}
                      </div>
                    </div>

                    <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderRadius: '0.625rem', border: '1px solid var(--border-color, #f1f5f9)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                        ASSIGNED OFFICER / WORKER
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <UserCheck size={16} color="var(--primary, #1e3a8a)" />
                        {assignedWorkerName ? (
                          <span style={{ color: '#047857' }}>{assignedWorkerName}</span>
                        ) : (
                          <span style={{ color: '#b45309', backgroundColor: '#fef3c7', padding: '0.15rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                            Under Review / Assignment Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Verification Checklist */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '1rem', marginTop: '2.25rem', borderBottom: '2px solid var(--border-color, #e2e8f0)', paddingBottom: '0.6rem' }}>
                    Document Verification Status
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '0.625rem' }}>
                    {liveDocs.map((doc, i) => {
                      const badge = getDocStatusBadge(doc.status);
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderRadius: '0.5rem', border: '1px solid var(--border-color, #e2e8f0)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                            <FileText size={16} color="var(--primary, #1e3a8a)" />
                            <span>{doc.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: badge.color, 
                              backgroundColor: badge.bg, 
                              padding: '0.2rem 0.65rem', 
                              borderRadius: '1rem' 
                            }}>
                              {badge.text}
                            </span>
                            {doc.fileUrl && (
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title="View uploaded document"
                                style={{ display: 'flex', alignItems: 'center', color: 'var(--primary, #1e3a8a)', padding: '0.2rem' }}
                              >
                                <ExternalLink size={15} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Support Info Box */}
                  <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <HelpCircle size={17} /> Need Assistance?
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#15803d', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      For queries regarding municipal approval or document submissions, contact our support desk:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: '#166534' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} /> <strong>+91 8940206541</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} /> <span>cb.construction2019@gmail.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: The 6 Stage-Wise Progress Timeline */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '1.25rem', borderBottom: '2px solid var(--border-color, #e2e8f0)', paddingBottom: '0.6rem' }}>
                    Stage-Wise Progress
                  </h3>
                  
                  {isRejected ? (
                    <div style={{ padding: '2rem', backgroundColor: '#fee2e2', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid #fca5a5' }}>
                      <XCircle size={48} color="#dc2626" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.5rem' }}>Application Rejected</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                        Your application was not approved during technical scrutiny. Please contact our liaison officer for rectification guidance and re-submission support.
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                      {/* Vertical Connecting Line */}
                      <div style={{ position: 'absolute', top: '14px', bottom: '24px', left: '10px', width: '2px', backgroundColor: '#e2e8f0' }}></div>
                      
                      {stagesList.map((stage, index) => {
                        const isDone = stage.status === 'Completed';
                        const isCurrent = stage.status === 'In Progress';
                        const isPending = stage.status === 'Pending';

                        return (
                          <div 
                            key={stage.key || index} 
                            style={{ 
                              position: 'relative', 
                              paddingBottom: index === stagesList.length - 1 ? '0.5rem' : '1.75rem', 
                              opacity: isPending ? 0.55 : 1, 
                              transition: 'opacity 0.3s' 
                            }}
                          >
                            {/* Marker Icon on Timeline */}
                            <div style={{ position: 'absolute', left: '-2rem', backgroundColor: 'var(--bg-surface, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 0' }}>
                              {isDone ? (
                                <CheckCircle2 color="#10b981" size={22} style={{ backgroundColor: 'white' }} />
                              ) : isCurrent ? (
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '4px solid var(--primary, #1e3a8a)', backgroundColor: '#ffffff', boxSizing: 'border-box' }}></div>
                              ) : (
                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #94a3b8', backgroundColor: '#ffffff', boxSizing: 'border-box', marginLeft: '3px' }}></div>
                              )}
                            </div>

                            {/* Stage Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <div style={{ 
                                fontWeight: 700, 
                                fontSize: '1rem',
                                color: isCurrent ? 'var(--primary, #1e3a8a)' : isDone ? 'var(--text-primary, #1e293b)' : '#64748b' 
                              }}>
                                {index + 1}. {stage.name}
                              </div>
                              
                              <div>
                                {isDone && (
                                  <span style={{ fontSize: '0.725rem', backgroundColor: '#d1fae5', color: '#047857', padding: '0.15rem 0.6rem', borderRadius: '1rem', fontWeight: 700 }}>
                                    Completed
                                  </span>
                                )}
                                {isCurrent && (
                                  <span style={{ fontSize: '0.725rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.6rem', borderRadius: '1rem', fontWeight: 700 }}>
                                    Current Stage
                                  </span>
                                )}
                                {isPending && (
                                  <span style={{ fontSize: '0.725rem', backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.15rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stage Description */}
                            <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4, marginBottom: '0.4rem' }}>
                              {stage.description || OFFICIAL_STAGES[index]?.description}
                            </div>

                            {/* Completed / Started Date */}
                            {(stage.completedDate || stage.startedDate) && (
                              <div style={{ fontSize: '0.75rem', color: isDone ? '#047857' : '#0369a1', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                <Calendar size={13} />
                                {isDone && stage.completedDate ? (
                                  <span>Completed on {formatDateNice(stage.completedDate)}</span>
                                ) : (
                                  <span>Initiated on {formatDateNice(stage.startedDate)}</span>
                                )}
                              </div>
                            )}

                            {/* Remarks from Admin/Worker */}
                            {stage.remarks && (
                              <div style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', borderLeft: '3px solid var(--primary, #1e3a8a)', padding: '0.45rem 0.75rem', borderRadius: '0 0.375rem 0.375rem 0', color: 'var(--text-primary, #334155)', margin: '0.4rem 0', lineHeight: 1.4 }}>
                                <strong>Remarks:</strong> {stage.remarks}
                              </div>
                            )}

                            {/* Responsible Person */}
                            {stage.responsiblePerson && (
                              <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                                Responsible: <span style={{ fontWeight: 600, color: 'var(--text-primary, #334155)' }}>{stage.responsiblePerson}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Stage Policy Footer */}
                  <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                    <strong>Approval Policy:</strong> Document Verification requires all mandatory identity and ownership documents to be validated. Building sanction orders are cleared only after final scrutiny.
                  </div>
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
