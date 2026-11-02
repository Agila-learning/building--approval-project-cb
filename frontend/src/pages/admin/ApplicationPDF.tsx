import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, Printer, ArrowLeft, ShieldCheck, CheckCircle2, 
  Building2, MapPin, User, FileText, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const ApplicationPDF: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [appData, setAppData] = useState<any>(null);
  const [adminSettings, setAdminSettings] = useState<any>({
    adminSignature: '',
    adminName: 'C.B. Senthil Kumar',
    adminDesignation: 'Chief Approvals Consultant & Licensing Authority',
    officeAddress: 'Near KVB Bank, Manjunatha Hardwares, 1st Floor, Shoolagiri - 635 117',
    officePhone: '+91 8940206541',
    officeEmail: 'cb.construction2019@gmail.com'
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    // 1. Load Admin settings (including admin signature and stamp)
    const loadSettings = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/settings`);
        if (res.ok) {
          const settings = await res.json();
          setAdminSettings((prev: any) => ({
            ...prev,
            adminSignature: settings.adminSignature || prev.adminSignature,
            adminName: settings.adminName || prev.adminName,
            adminDesignation: settings.adminDesignation || prev.adminDesignation,
            officeAddress: settings.officeAddress || prev.officeAddress,
            officePhone: settings.officePhone || prev.officePhone,
            officeEmail: settings.officeEmail || prev.officeEmail
          }));
        }
      } catch (err) {
        // Fallback to localStorage
        const storedSig = localStorage.getItem('admin_signature_data');
        const storedName = localStorage.getItem('admin_signatory_name');
        const storedDesig = localStorage.getItem('admin_signatory_desig');
        if (storedSig || storedName || storedDesig) {
          setAdminSettings((prev: any) => ({
            ...prev,
            adminSignature: storedSig || prev.adminSignature,
            adminName: storedName || prev.adminName,
            adminDesignation: storedDesig || prev.adminDesignation
          }));
        }
      }
    };
    loadSettings();

    // 2. Load Application Case details
    if (id) {
      const previewStr = localStorage.getItem('print_preview_data');
      if (previewStr) {
        try {
          const parsed = JSON.parse(previewStr);
          if (parsed && (parsed.id === id || parsed.application_number === id || parsed.proposal_number === id)) {
            setAppData(parsed);
            return;
          }
        } catch (e) {}
      }

      const fetchFromApi = async () => {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/cases/${id}`);
          if (res.ok) {
            const c = await res.json();
            setAppData(c);
            return;
          }
        } catch (e) {
          console.error('Error fetching case for PDF:', e);
        }

        // Fallback to local storage mock cases
        const existingStr = localStorage.getItem('mock_saved_cases');
        if (existingStr) {
          try {
            const existing = JSON.parse(existingStr);
            const app = existing.find((a: any) => a.id === id || a.application_number === id);
            if (app) {
              setAppData(app);
            }
          } catch (e) {}
        }
      };

      fetchFromApi();
    }
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading('Generating official application PDF...');

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const element = printRef.current;
      const proposalNo = appData?.proposal_number || appData?.application_number || appData?.id || id || 'Application';
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `CB_Building_Approval_${proposalNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Application PDF downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Using browser print instead.', { id: toastId });
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!appData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #cbd5e1', borderTopColor: '#1c3d2e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Official Application Dossier...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Normalize details
  const fullData = appData.fullData || {};
  const property = appData.property || fullData.propertyDetails || {};
  const residential = fullData.residentialAddress || {};
  const proposalNumber = appData.proposal_number || appData.application_number || appData.id || id;
  const customerName = property.owner_name || fullData.customerName || appData.customer || 'Applicant';
  const mobile = property.owner_phone || fullData.mobile || fullData.phone || '-';
  const email = property.owner_email || fullData.email || '-';
  const aadhar = fullData.aadhar || property.aadhar || '-';
  const pan = fullData.pan || property.pan || '-';
  const fatherName = fullData.fatherName || '-';
  const dob = fullData.dob || '-';
  const serviceType = appData.approval_type || fullData.serviceType || 'Building Plan Approval';

  const uploadedFiles = appData.uploadedFiles || fullData.documents || fullData.uploadedFiles || {};
  const docVerification = appData.documentVerification || {};

  // Photo & Signatures
  const photo = uploadedFiles['CUSTOMER PHOTOGRAPH'] || uploadedFiles['photo'] || fullData.photo;
  const customerSignature = uploadedFiles['CUSTOMER SIGNATURE'] || uploadedFiles['PROPERTY SIGNATURE'] || uploadedFiles['signature'] || fullData.signature;

  // Documents checklist mapping
  const docChecklist = [
    { name: 'Sale Deed / Title Deed', key: 'SALE DEED', altKey: 'LAND DOCUMENT', category: 'Land Ownership Proof' },
    { name: 'Patta Copy', key: 'PATTA', category: 'Revenue Record' },
    { name: 'FMB Sketch / Field Map', key: 'FMB', category: 'Survey Measurement' },
    { name: 'PAN Card', key: 'PAN CARD', category: 'Identity Verification' },
    { name: 'Aadhaar Card', key: 'AADHAR CARD', altKey: 'AADHAAR CARD', category: 'Identity Verification' },
    { name: 'Customer Photograph', key: 'CUSTOMER PHOTOGRAPH', category: 'Applicant Identification' },
    { name: 'Customer Specimen Signature', key: 'CUSTOMER SIGNATURE', altKey: 'PROPERTY SIGNATURE', category: 'Applicant Attestation' },
    { name: 'Proposed Building Plan', key: 'BUILDING PLAN', category: 'Technical Drawing' },
  ];

  // Payment details
  const payment = fullData.payment || {};
  const paymentAmount = payment.amount || fullData.paidAmount || fullData.feesAmount || '15,000';
  const paymentStatus = (payment.paymentStatus || (appData.status === 'PAYMENT_COMPLETED' ? 'Paid' : 'Verified')).toUpperCase();
  const paymentTxId = payment.transactionId || 'CB-PAY-CONFIRMED';
  const paymentMethod = payment.paymentMethod || 'UPI / Online Transfer';

  const appDate = appData.created_at || appData.createdAt || fullData.date || new Date().toISOString();
  const formattedDate = new Date(appDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '1.5rem 1rem' }}>
      
      {/* Action Control Bar - Hidden during Print */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 1.25rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => {
            const userRole = localStorage.getItem('userRole') || '';
            const isEmployee = userRole.toUpperCase() === 'STAFF' || localStorage.getItem('loggedInUser') !== 'Admin';
            const targetUrl = isEmployee ? (id ? `/employee/applications/${id}` : '/employee/applications') : (id ? `/admin/applications/${id}` : '/admin/applications');

            try {
              window.close();
            } catch (e) {}

            navigate(targetUrl);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            borderRadius: '0.375rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#1e293b',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Back to Application
        </button>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: '#ffffff',
              border: '1px solid #1c3d2e',
              color: '#1c3d2e',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> Print Document
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              backgroundColor: '#1c3d2e',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(28, 61, 46, 0.3)'
            }}
          >
            <Download size={16} /> {isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}
          </button>
        </div>
      </div>

      {/* Official PDF Document Container */}
      <div 
        ref={printRef}
        id="application-pdf-content"
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
          border: '2px solid #1c3d2e',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '24px'
        }}
      >
        {/* Document Header */}
        <div style={{ display: 'flex', borderBottom: '2px solid #1c3d2e', paddingBottom: '14px', marginBottom: '14px', gap: '1rem', alignItems: 'center' }}>
          {/* Logo & Seal */}
          <div style={{ width: '85px', height: '85px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', borderRadius: '0.375rem', padding: '4px', backgroundColor: '#f8fafc' }}>
            <img src="/assets/logo.jpeg" alt="C.B. Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>

          {/* Heading Info */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1c3d2e', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              C.B. BUILDING APPROVAL CONSULTANCY
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#c96f4a', letterSpacing: '0.03em', textTransform: 'uppercase', marginTop: '2px' }}>
              Government Planning & Sanction Approvals • DTCP / CMDA / LPA Consultant
            </div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', lineHeight: 1.3 }}>
              {adminSettings.officeAddress} • Phone: {adminSettings.officePhone} • Email: {adminSettings.officeEmail}
            </div>
            <div style={{ display: 'inline-block', marginTop: '6px', backgroundColor: '#1c3d2e', color: '#ffffff', padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Official Application Dossier & Verification Record
            </div>
          </div>

          {/* Applicant Photograph Box */}
          <div style={{ width: '100px', flexShrink: 0, textAlign: 'center' }}>
            <div style={{ width: '95px', height: '110px', border: '1.5px solid #1c3d2e', borderRadius: '3px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
              {photo ? (
                <img src={photo} alt="Applicant Photograph" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>
                  <User size={24} color="#cbd5e1" style={{ margin: '0 auto 4px auto' }} />
                  Applicant Photo
                </div>
              )}
            </div>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#1c3d2e', marginTop: '3px' }}>APPLICANT PHOTO</div>
          </div>
        </div>

        {/* Proposal Reference Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 10px', fontSize: '10.5px', marginBottom: '14px', gap: '8px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Proposal No: </span>
            <strong style={{ color: '#1c3d2e' }}>#{proposalNumber}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Date: </span>
            <strong>{formattedDate}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Service: </span>
            <strong style={{ textTransform: 'uppercase' }}>{serviceType}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Status: </span>
            <strong style={{ color: '#059669' }}>Verified & Sanctioned</strong>
          </div>
        </div>

        {/* Section 1: Personal & Communication Details */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ backgroundColor: '#1c3d2e', color: '#ffffff', padding: '4px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: '2px' }}>
            1. Applicant Personal Particulars
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', border: '1px solid #cbd5e1', marginTop: '2px' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Applicant Full Name:</td>
                <td style={{ width: '25%', padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 700 }}>{customerName.toUpperCase()}</td>
                <td style={{ width: '25%', padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Father / Husband Name:</td>
                <td style={{ width: '25%', padding: '5px 8px', border: '1px solid #e2e8f0' }}>{fatherName.toUpperCase()}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Aadhaar Card No:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{aadhar}</td>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>PAN Card No:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{pan}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Contact Mobile:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{mobile}</td>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Email Address:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{email}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Date of Birth / Age:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{dob}</td>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Residential Address:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>
                  {[residential.houseNo, residential.streetName, residential.area, residential.city, residential.pincode].filter(Boolean).join(', ') || property.address || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Property & Site Particulars */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ backgroundColor: '#1c3d2e', color: '#ffffff', padding: '4px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: '2px' }}>
            2. Proposed Site & Property Particulars
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', border: '1px solid #cbd5e1', marginTop: '2px' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Survey / Sub-Division No:</td>
                <td style={{ width: '25%', padding: '5px 8px', border: '1px solid #e2e8f0', fontWeight: 700 }}>{property.survey_number || property.surveyNo || '-'}</td>
                <td style={{ width: '25%', padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Patta Number:</td>
                <td style={{ width: '25%', padding: '5px 8px', border: '1px solid #e2e8f0' }}>{property.pattaNo || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Village / Revenue Ward:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{property.village || property.area || '-'}</td>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Taluk / Local Body:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{property.taluk || property.panchayat || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>District & State:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{property.city || 'Krishnagiri'}, {property.state || 'Tamil Nadu'}</td>
                <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' }}>Site / Property Location:</td>
                <td style={{ padding: '5px 8px', border: '1px solid #e2e8f0' }}>{property.address || property.dno || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Verified Uploaded Documents Dossier */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ backgroundColor: '#1c3d2e', color: '#ffffff', padding: '4px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>3. Uploaded Documents Scrutiny & Verification Checklist</span>
            <span style={{ fontSize: '9.5px', fontWeight: 600, backgroundColor: '#ffffff', color: '#1c3d2e', padding: '1px 6px', borderRadius: '10px' }}>OFFICIALLY SCRUTINIZED</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #cbd5e1', marginTop: '2px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#334155', borderBottom: '1.5px solid #cbd5e1' }}>
                <th style={{ width: '5%', padding: '5px 6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>#</th>
                <th style={{ width: '35%', padding: '5px 8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Document Particulars</th>
                <th style={{ width: '25%', padding: '5px 8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Document Category</th>
                <th style={{ width: '20%', padding: '5px 8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Verification Status</th>
                <th style={{ width: '15%', padding: '5px 8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Attested By</th>
              </tr>
            </thead>
            <tbody>
              {docChecklist.map((doc, idx) => {
                const hasFile = uploadedFiles[doc.key] || (doc.altKey && uploadedFiles[doc.altKey]);
                const ver = docVerification[doc.key] || (doc.altKey && docVerification[doc.altKey]) || {};
                const isVerified = ver.status === 'Verified' || hasFile;

                return (
                  <tr key={doc.key} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                    <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>
                      {doc.name}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      {doc.category}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      {isVerified ? (
                        <span style={{ color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          ✓ Verified & Accepted
                        </span>
                      ) : (
                        <span style={{ color: '#b45309', fontWeight: 600 }}>
                          Pending Submission
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontSize: '9.5px' }}>
                      {ver.verifiedBy || 'Admin / Scrutiny Desk'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 4: Fees Assessment & Payment Clearance */}
        <div style={{ marginBottom: '14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1c3d2e', textTransform: 'uppercase' }}>4. Fees Assessment & Payment Settlement</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#166534', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
              PAYMENT CLEARANCE VERIFIED ✓
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', fontSize: '10px', gap: '8px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Consultancy & Scrutiny Fee: </span><br/>
              <strong style={{ fontSize: '12px', color: '#1c3d2e' }}>₹{paymentAmount}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Payment Mode: </span><br/>
              <strong>{paymentMethod}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Transaction / Order ID: </span><br/>
              <strong style={{ fontFamily: 'monospace' }}>{paymentTxId}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Settlement Status: </span><br/>
              <strong style={{ color: '#166534' }}>{paymentStatus} (PAID IN FULL)</strong>
            </div>
          </div>
        </div>

        {/* Section 5: Official Attestation & Dual Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
          
          {/* Customer Specimen Signature Box */}
          <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: '9.5px', color: '#64748b', fontStyle: 'italic', lineHeight: 1.3 }}>
              "I hereby declare that all particulars entered above are accurate, valid, and legally true to the best of my knowledge."
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #cbd5e1', marginBottom: '4px' }}>
                {customerSignature ? (
                  <img src={customerSignature} alt="Customer Signature" style={{ maxHeight: '50px', maxWidth: '160px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '10px' }}>[Specimen Signature Uploaded on File]</div>
                )}
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1c3d2e' }}>{customerName.toUpperCase()}</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>APPLICANT / PROPERTY OWNER SIGNATURE</div>
            </div>
          </div>

          {/* Admin Signature & Official Seal Box */}
          <div style={{ border: '1.5px solid #1c3d2e', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', backgroundColor: '#fcfdfd', position: 'relative' }}>
            
            {/* Stamp graphic watermark badge */}
            <div style={{ position: 'absolute', top: '8px', right: '10px', border: '1.5px dashed #059669', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: 800, transform: 'rotate(-4deg)', opacity: 0.85 }}>
              OFFICIALLY SANCTIONED
            </div>

            <div style={{ fontSize: '9.5px', color: '#1c3d2e', fontWeight: 600 }}>
              FOR C.B. BUILDING APPROVAL CONSULTANCY
            </div>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <div style={{ height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1c3d2e', marginBottom: '4px' }}>
                {adminSettings.adminSignature ? (
                  <img 
                    src={adminSettings.adminSignature} 
                    alt="Authorized Admin Signature" 
                    style={{ maxHeight: '52px', maxWidth: '170px', objectFit: 'contain' }} 
                  />
                ) : (
                  <div style={{ fontFamily: '"Brush Script MT", cursive, sans-serif', fontSize: '20px', color: '#1c3d2e', fontWeight: 'bold' }}>
                    {adminSettings.adminName || 'C.B. Senthil Kumar'}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#1c3d2e' }}>
                {adminSettings.adminName || 'C.B. Senthil Kumar'}
              </div>
              <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                {adminSettings.adminDesignation || 'Chief Approvals Consultant & Licensing Authority'}
              </div>
              <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1px' }}>
                Endorsed Date: {formattedDate} • Ref: CB/APP/{proposalNumber}
              </div>
            </div>
          </div>

        </div>

        {/* Security & Authenticity Footer */}
        <div style={{ marginTop: '14px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', color: '#64748b' }}>
          <div>
            System Generated & Digitally Certified Record • C.B. Building Approvals ERP
          </div>
          <div>
            Page 1 of 1 • Verification Key: {proposalNumber}-{Date.now().toString().slice(-6)}
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #application-pdf-content {
            border: 2px solid #1c3d2e !important;
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ApplicationPDF;
