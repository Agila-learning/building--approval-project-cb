import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Pencil, CheckCircle2, Clock, AlertCircle, Calendar, 
  User, Building2, MapPin, FileText, Download, Eye, ExternalLink,
  ShieldCheck, ShieldAlert, ArrowRight, UserCheck, X, MessageCircle,
  CreditCard, Check, Lock, Send, Mail, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

interface StageRecord {
  id?: number;
  name: string;
  key?: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  startedDate: string | null;
  completedDate: string | null;
  remarks: string;
  responsiblePerson: string;
}

const STAGE_NAMES = [
  'Application Submitted',
  'Document Completed',
  'Payment',
  'Site Visit Completed',
  'Finally Approved'
];

const ApplicationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const loggedInUser = localStorage.getItem('loggedInUser') || '';
  const userRole = localStorage.getItem('userRole') || (loggedInUser === 'Admin' ? 'ADMIN' : 'STAFF');
  const staffId = localStorage.getItem('staffId') || '';
  const isAdmin = userRole === 'ADMIN' || loggedInUser === 'Admin';

  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [caseRecord, setCaseRecord] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Update Status Modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [targetStageIndex, setTargetStageIndex] = useState(0);
  const [newStageStatus, setNewStageStatus] = useState<'Completed' | 'In Progress' | 'Pending'>('Completed');
  const [stageRemarks, setStageRemarks] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  // Payment Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('15000');
  const [payMethod, setPayMethod] = useState('UPI / QR Code');
  const [payTxId, setPayTxId] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Send Payment Request Modal state
  const [isSendPaymentRequestModalOpen, setIsSendPaymentRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('15000');
  const [requestNote, setRequestNote] = useState('');
  const [isSendingPaymentRequest, setIsSendingPaymentRequest] = useState(false);
  const [bankSettings, setBankSettings] = useState<any>(null);

  // Site Visit Modal state
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [isSavingSiteVisit, setIsSavingSiteVisit] = useState(false);

  const fetchStaffList = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/users`);
      if (res.ok) {
        const list = await res.json();
        setStaffList(list.filter((u: any) => u.status === 'Active' && u.role === 'STAFF'));
      }
    } catch (e) {
      console.error('Failed to fetch staff list', e);
    }
  };

  const fetchCaseDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases/${id}`, {
        headers: {
          'x-user-role': userRole,
          'x-user-name': loggedInUser,
          'x-staff-id': staffId
        }
      });

      if (res.status === 403) {
        setIsForbidden(true);
        setIsLoading(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setCaseRecord(data);
        setIsForbidden(false);
      } else {
        toast.error('Failed to load application data.');
      }
    } catch (e: any) {
      console.error('Error fetching application:', e);
      toast.error('Network error loading application.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    if (isAdmin) {
      fetchStaffList();
    }
  }, [id, userRole, loggedInUser, staffId]);

  if (isForbidden) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem 2rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fca5a5', textAlign: 'center' }}>
        <ShieldAlert size={60} color="#ef4444" style={{ margin: '0 auto 1.25rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: '#b91c1c', fontSize: '0.9375rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          You do not have authorization to view this application. Workers may only access cases explicitly assigned to them by the Administrator.
        </p>
        <button 
          onClick={() => navigate(userRole === 'STAFF' ? '/employee/applications' : '/admin/applications')}
          className="btn-primary"
          style={{ padding: '0.625rem 1.5rem' }}
        >
          Return to My Applications
        </button>
      </div>
    );
  }

  if (isLoading || !caseRecord) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>Loading application and progress timeline...</div>
      </div>
    );
  }

  const stages: StageRecord[] = (caseRecord.fullData?.stages && caseRecord.fullData.stages.length > 0)
    ? caseRecord.fullData.stages
    : (caseRecord.stages || []);

  const fullData = caseRecord.fullData || {};
  const property = caseRecord.property || {};
  const proposalNumber = caseRecord.application_number || id;
  const currentStatus = caseRecord.status || 'Application Submitted';
  const assignedStaffName = caseRecord.assigned_staff?.name || fullData.staff || 'Unassigned';

  const isDocStageCompleted = stages[1]?.status === 'Completed' || currentStatus === 'Document Completed';
  const isPaymentCompleted = stages[2]?.status === 'Completed' || currentStatus === 'Payment Completed' || fullData.payment?.paymentStatus === 'Paid';
  const isSiteVisitCompleted = stages[3]?.status === 'Completed' || currentStatus === 'Site Visit Completed';
  const isFinalApproved = stages[4]?.status === 'Completed' || currentStatus === 'Finally Approved' || currentStatus === 'Final Approval' || currentStatus === 'Application Completed' || currentStatus === 'Approved';

  useEffect(() => {
    // Load bank settings for preview
    const loadBank = async () => {
      try {
        const local = localStorage.getItem('companyBankDetails');
        if (local) setBankSettings(JSON.parse(local));
        const res = await fetch(`${getApiUrl()}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data?.bankDetails) setBankSettings(data.bankDetails);
        }
      } catch (_) {}
    };
    loadBank();
  }, []);

  const handleSendPaymentRequest = async (channel: 'email' | 'whatsapp') => {
    setIsSendingPaymentRequest(true);
    try {
      const res = await fetch(`${getApiUrl()}/payments/send-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          caseId: caseRecord.id || id,
          amount: parseFloat(requestAmount) || 15000,
          notes: requestNote.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (channel === 'email') {
          if (data.emailSent) {
            toast.success(`Payment request email dispatched to ${data.customerEmail}!`);
          } else {
            toast.error(data.message || 'Customer email not found on file.');
          }
        }
        if (channel === 'whatsapp' && data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
        setIsSendPaymentRequestModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to send payment request.');
      }
    } catch (e: any) {
      toast.error('Network error sending payment request.');
    } finally {
      setIsSendingPaymentRequest(false);
    }
  };

  const handleShareWhatsApp = () => {
    const cleanMobile = (property.owner_phone || fullData.mobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      toast.error('Customer phone number not available or invalid.');
      return;
    }
    const uploadUrl = `${window.location.origin}/upload/${proposalNumber}`;
    const customerName = property.owner_name || fullData.customerName || 'Customer';
    const text = `Dear ${customerName},\n\nGreetings from C.B. Building Approvals.\nYour building approval application (${proposalNumber}) is in progress. Please upload your required documents using your secure personal upload link below:\n\n${uploadUrl}\n\nRequired Documents Checklist:\n1. Applicant Passport Photograph\n2. Applicant Signature\n3. Aadhaar Card\n4. PAN Card\n5. Sale Deed / Land Document\n6. Patta Copy\n7. Proposed Building Plan\n\nOnce uploaded, our team will verify and submit for approval.\nThank you!\nC.B. Building Approvals`;
    window.open(`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleApproveAllDocs = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${getApiUrl()}/documents/approve-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({ caseId: caseRecord.id || id })
      });
      if (res.ok) {
        toast.success('All required documents approved! Payment stage is now unlocked.');
        fetchCaseDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to approve documents.');
      }
    } catch (e) {
      toast.error('Network error approving documents.');
    }
  };

  const handleVerifySingleDoc = async (docKey: string, status: 'Verified' | 'Worker Verified' | 'Re-upload Required') => {
    try {
      const res = await fetch(`${getApiUrl()}/documents/verify-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-name': loggedInUser,
          'x-staff-id': staffId
        },
        body: JSON.stringify({
          caseId: caseRecord.id || id,
          documentKey: docKey,
          status
        })
      });
      if (res.ok) {
        toast.success(isAdmin ? `Document ${status}` : 'Document marked as Worker Verified');
        fetchCaseDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update document status');
      }
    } catch (e) {
      toast.error('Network error updating document status');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCash = payMethod?.toLowerCase().includes('cash');
    const finalTxId = isCash && !payTxId.trim()
      ? `CASH-${Date.now().toString().slice(-6)}`
      : payTxId.trim();

    if (!finalTxId && !isCash) {
      toast.error('Please enter Transaction ID / UTR.');
      return;
    }
    setIsSavingPayment(true);
    try {
      const res = await fetch(`${getApiUrl()}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          caseId: caseRecord.id || id,
          amount: parseFloat(payAmount) || 0,
          paymentMethod: payMethod,
          transactionId: finalTxId,
          paymentStatus: 'Paid',
          notes: payNotes.trim(),
          sendEmail: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Payment verified & recorded! Site Visit stage unlocked.');
        setIsPaymentModalOpen(false);
        fetchCaseDetails();
      } else {
        toast.error(data.error || 'Payment recording failed.');
      }
    } catch (err) {
      toast.error('Network error recording payment.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSaveSiteVisit = async (adminConfirmed: boolean) => {
    setIsSavingSiteVisit(true);
    try {
      const res = await fetch(`${getApiUrl()}/cases/${caseRecord.id || id}/site-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
          'x-user-name': loggedInUser,
          'x-staff-id': staffId
        },
        body: JSON.stringify({
          visitDate,
          inspectorNotes,
          inspectionStatus: 'Completed',
          adminConfirmed
        })
      });
      if (res.ok) {
        toast.success(adminConfirmed ? 'Site visit confirmed! Final Approval stage unlocked.' : 'Site visit report submitted for Admin review.');
        setIsSiteVisitModalOpen(false);
        fetchCaseDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update site visit.');
      }
    } catch (e) {
      toast.error('Network error saving site visit.');
    } finally {
      setIsSavingSiteVisit(false);
    }
  };

  const handleGrantFinalApproval = async () => {
    if (!isAdmin) return;
    const confirm = window.confirm(`Grant Final Approval for proposal #${proposalNumber}? This will issue sanction and dispatch the official application completion email to ${property.owner_email || fullData.email}.`);
    if (!confirm) return;

    try {
      const res = await fetch(`${getApiUrl()}/cases/${caseRecord.id || id}/stages/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          stageKey: 'stage_final_approval',
          stageIndex: 4,
          status: 'Completed',
          remarks: 'Official building plan approval order sanctioned and dispatched.',
          responsiblePerson: loggedInUser
        })
      });
      if (res.ok) {
        toast.success('Application Sanctioned & Approved! Completion email dispatched.');
        fetchCaseDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to grant final approval.');
      }
    } catch (e) {
      toast.error('Network error updating stage.');
    }
  };

  const handleOpenUpdateModal = (stageIndex: number) => {
    if (!isAdmin) {
      toast.error('Only Administrators have permission to update application stages.');
      return;
    }
    setTargetStageIndex(stageIndex);
    const target = stages[stageIndex];
    setNewStageStatus(target ? (target.status === 'Completed' ? 'Completed' : 'Completed') : 'Completed');
    setStageRemarks(target ? target.remarks : '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveStageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsUpdatingStage(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases/${caseRecord.id || id}/stages/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          stageIndex: targetStageIndex,
          status: newStageStatus,
          remarks: stageRemarks.trim(),
          responsiblePerson: loggedInUser
        })
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success(`Stage "${STAGE_NAMES[targetStageIndex]}" updated successfully!`);
        setIsUpdateModalOpen(false);
        fetchCaseDetails();
      } else {
        toast.error(resData.error || 'Failed to update stage.');
      }
    } catch (e: any) {
      console.error('Error updating stage:', e);
      toast.error('Failed to communicate with server.');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAdminAssignWorker = async (staffName: string) => {
    if (!isAdmin) return;
    const selectedStaff = staffList.find(s => s.name === staffName);
    const staffIdVal = selectedStaff ? selectedStaff.id : null;

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases/${caseRecord.id || id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
          'x-user-name': loggedInUser
        },
        body: JSON.stringify({
          staff: staffName,
          assigned_staff_id: staffIdVal
        })
      });

      if (res.ok) {
        toast.success(staffName !== 'Unassigned' ? `Assigned to ${staffName}` : 'Application set as Unassigned');
        fetchCaseDetails();
      } else {
        toast.error('Failed to update worker assignment.');
      }
    } catch (e) {
      toast.error('Error assigning worker.');
    }
  };

  // Uploaded docs array from caseRecord
  const uploadedFiles = caseRecord.uploadedFiles || {};
  const docVerification = caseRecord.documentVerification || {};

  const baseDocumentList = [
    { key: 'CUSTOMER PHOTOGRAPH', label: 'Customer Photograph' },
    { key: 'CUSTOMER SIGNATURE', label: 'Customer Signature' },
    { key: 'AADHAR CARD', label: 'Aadhaar Card' },
    { key: 'PAN CARD', label: 'PAN Card' },
    { key: 'SALE DEED', altKey: 'LAND DOCUMENT', label: 'Sale Deed / Land Document' },
    { key: 'PATTA', label: 'Patta Copy' },
    { key: 'BUILDING PLAN', label: 'Building Plan' },
  ];

  // Dynamic document keys from custom uploads
  const standardKeys = ['CUSTOMER PHOTOGRAPH', 'CUSTOMER SIGNATURE', 'PROPERTY SIGNATURE', 'AADHAR CARD', 'AADHAAR CARD', 'PAN CARD', 'SALE DEED', 'LAND DOCUMENT', 'PATTA', 'BUILDING PLAN'];
  const customUploadedKeys = Object.keys(uploadedFiles).filter(k => !standardKeys.includes(k) && Boolean(uploadedFiles[k]));

  const documentList = [
    ...baseDocumentList,
    ...customUploadedKeys.map(k => ({
      key: k,
      label: k.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    }))
  ];

  const uploadedFilesCount = documentList.filter(d => uploadedFiles[d.key] || (d.altKey && uploadedFiles[d.altKey])).length;
  const workerVerifiedCount = documentList.filter(d => {
    const v = docVerification[d.key] || (d.altKey && docVerification[d.altKey]);
    return v && (v.status === 'Worker Verified' || v.status === 'Verified');
  }).length;
  const adminApprovedCount = documentList.filter(d => {
    const v = docVerification[d.key] || (d.altKey && docVerification[d.altKey]);
    return v && v.status === 'Verified';
  }).length;
  const allDocsApproved = adminApprovedCount >= documentList.length && documentList.length > 0;

  const isStage0Done = stages[0]?.status === 'Completed';
  const isStage1Done = stages[1]?.status === 'Completed' || allDocsApproved;
  const isStage2Done = stages[2]?.status === 'Completed' || fullData.payment?.paymentStatus === 'Paid';
  const isStage3Done = stages[3]?.status === 'Completed' || Boolean(fullData.siteVisit?.adminConfirmed);
  const isStage4Done = stages[4]?.status === 'Completed' || currentStatus === 'Application Completed';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(isAdmin ? '/admin/applications' : '/employee/applications')}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
            title="Back to List"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="heading-2" style={{ margin: 0 }}>Proposal #{proposalNumber}</h1>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                backgroundColor: (currentStatus === 'Finally Approved' || currentStatus === 'Final Approval' || currentStatus === 'Application Completed' || currentStatus === 'Approved') ? '#dcfce7' : currentStatus === 'Application Submitted' ? '#dbeafe' : '#fef3c7',
                color: (currentStatus === 'Finally Approved' || currentStatus === 'Final Approval' || currentStatus === 'Application Completed' || currentStatus === 'Approved') ? '#166534' : currentStatus === 'Application Submitted' ? '#1e40af' : '#b45309',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                {currentStatus === 'Final Approval' ? 'Finally Approved' : currentStatus}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Stage-Wise Progress Tracking & Real-Time Verification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open(`/print/application/${proposalNumber || id}`, '_blank')}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1.5px solid var(--primary)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            title="Download complete application dossier with photo, uploaded documents list, and Admin signature stamp"
          >
            <Download size={15} /> Download Application PDF
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => navigate(`/admin/applications/${id}/edit`)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Pencil size={15} /> Edit Customer Details
              </button>
              <button
                onClick={() => {
                  // Find current in progress or next pending stage
                  const inProgIdx = stages.findIndex(s => s.status === 'In Progress');
                  const nextIdx = inProgIdx !== -1 ? inProgIdx : stages.findIndex(s => s.status === 'Pending');
                  handleOpenUpdateModal(nextIdx !== -1 ? nextIdx : 0);
                }}
                className="btn-primary"
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ShieldCheck size={16} /> Update Status
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Customer Info Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Customer Details
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
            {property.owner_name || fullData.customerName || 'Customer'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
            <span>📞</span> {property.owner_phone || fullData.mobile || 'No phone'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>✉️</span> {property.owner_email || fullData.email || 'No email'}
          </div>
        </div>

        {/* Worker Assignment Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assigned Worker
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: assignedStaffName === 'Unassigned' ? '#dc2626' : 'var(--primary-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={18} color={assignedStaffName === 'Unassigned' ? '#dc2626' : 'var(--primary)'} />
              {assignedStaffName}
            </div>
            {isAdmin ? (
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Assign Worker:
                </label>
                <select
                  value={assignedStaffName}
                  onChange={(e) => handleAdminAssignWorker(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.8125rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <option value="Unassigned">Unassigned (Hold)</option>
                  {staffList.map((s: any) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.staffId || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Assigned by Admin
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.45rem',
              borderRadius: '0.375rem',
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
            title="Send WhatsApp document upload link to customer"
          >
            <MessageCircle size={14} /> Send WhatsApp Upload Link
          </button>
        </div>

        {/* Product / Service Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Product & Property
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
            {(caseRecord.approval_type || fullData.serviceType || 'BUILDING_PLAN_APPROVAL').replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Survey No: <strong>{property.survey_number || fullData.propertyDetails?.surveyNo || 'TBD'}</strong>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Patta No: <strong>{fullData.propertyDetails?.pattaNo || '—'}</strong>
          </div>
        </div>

        {/* Proposal Date Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Proposal Date
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
            {caseRecord.created_at ? new Date(caseRecord.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Tracking Link Active
          </div>
        </div>
      </div>

      {/* Main Section: The 5 Stages Progress Timeline */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Stage-Wise Progress Timeline
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Complete chronological lifecycle of building approval application #{proposalNumber}
            </p>
          </div>

          {isAdmin && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Click any stage below to update remarks or override status
            </div>
          )}
        </div>

        {/* Vertical Stage Timeline List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'Completed';
            const isInProgress = stage.status === 'In Progress';
            const isPending = stage.status === 'Pending';

            return (
              <div 
                key={stage.id || idx}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  cursor: isAdmin ? 'pointer' : 'default',
                  padding: '1.25rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isInProgress ? 'rgba(30, 58, 138, 0.04)' : 'transparent',
                  border: isInProgress ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s'
                }}
                onClick={() => isAdmin && handleOpenUpdateModal(idx)}
              >
                {/* Step indicator circle */}
                <div style={{
                  flexShrink: 0,
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#10b981' : isInProgress ? 'var(--primary)' : '#e2e8f0',
                  color: isCompleted || isInProgress ? '#fff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  boxShadow: isInProgress ? '0 0 0 4px rgba(30, 58, 138, 0.15)' : 'none'
                }}>
                  {isCompleted ? <CheckCircle2 size={22} /> : idx + 1}
                </div>

                {/* Stage Info Body */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                        {idx + 1}. {stage.name}
                      </h3>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '1rem',
                        backgroundColor: isCompleted ? '#dcfce7' : isInProgress ? '#dbeafe' : '#f1f5f9',
                        color: isCompleted ? '#166534' : isInProgress ? '#1e40af' : '#64748b'
                      }}>
                        {stage.status.toUpperCase()}
                      </span>
                    </div>

                    {isAdmin && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                        Click to Edit Remarks →
                      </span>
                    )}
                  </div>

                  {/* Stage Context / Metrics */}
                  {idx === 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Worker Assignment: <strong style={{ color: assignedStaffName === 'Unassigned' ? '#dc2626' : 'var(--primary)' }}>
                        {assignedStaffName === 'Unassigned' ? 'Unassigned (Waiting for Admin assignment)' : `Assigned to ${assignedStaffName}`}
                      </strong>
                    </div>
                  )}

                  {idx === 1 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Uploads: <strong>{uploadedFilesCount}/{documentList.length}</strong></span>
                      <span style={{ color: '#0369a1' }}>Worker Verified: <strong>{workerVerifiedCount}/{documentList.length}</strong></span>
                      <span style={{ color: allDocsApproved ? '#059669' : '#b45309', fontWeight: 600 }}>
                        Admin Approved: <strong>{adminApprovedCount}/{documentList.length}</strong> {allDocsApproved ? '✓ (Completed)' : ''}
                      </span>
                    </div>
                  )}

                  {idx === 2 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {isStage2Done ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          ✓ Payment Verified: ₹{fullData.payment?.amount || payAmount} via {fullData.payment?.paymentMethod || payMethod} (TxID: {fullData.payment?.transactionId || 'Confirmed'})
                        </span>
                      ) : (
                        <span style={{ color: isStage1Done ? '#b45309' : '#64748b' }}>
                          {isStage1Done ? 'Stage 2 Documents Approved. Ready for payment collection & verification.' : 'Locked: Requires all required documents to be approved by Admin.'}
                        </span>
                      )}
                    </div>
                  )}

                  {idx === 3 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {isStage3Done ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          ✓ Site Inspection Confirmed by Admin {fullData.siteVisit?.visitDate ? `on ${new Date(fullData.siteVisit.visitDate).toLocaleDateString('en-GB')}` : ''}
                        </span>
                      ) : (
                        <span style={{ color: isStage2Done ? '#b45309' : '#64748b' }}>
                          {isStage2Done ? (fullData.siteVisit?.inspectorNotes ? 'Site findings submitted by field worker. Awaiting Admin confirmation.' : 'Payment confirmed. Ready for physical site inspection.') : 'Locked: Requires Stage 3 Payment to be completed first.'}
                        </span>
                      )}
                    </div>
                  )}

                  {idx === 4 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {isStage4Done ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>
                          ✓ Official Building Sanction Order Issued. Automated Completion Email dispatched to customer via Brevo.
                        </span>
                      ) : (
                        <span style={{ color: (isStage0Done && isStage1Done && isStage2Done && isStage3Done) ? '#b45309' : '#64748b' }}>
                          {(isStage0Done && isStage1Done && isStage2Done && isStage3Done) 
                            ? 'All preliminary stages completed! Ready for Admin Final Approval.'
                            : 'Locked: Requires Stages 1 to 4 to be completed first.'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stage Action Buttons */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {idx === 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(); }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#25D366',
                          color: 'white',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageCircle size={15} /> Share WhatsApp Upload Link
                      </button>
                    )}

                    {idx === 1 && isAdmin && !allDocsApproved && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleApproveAllDocs(); }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={15} /> Approve All Required Documents
                      </button>
                    )}

                    {idx === 2 && !isStage2Done && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isAdmin && (
                          <button
                            type="button"
                            disabled={!isStage1Done}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isStage1Done) {
                                toast.error('Payment locked: All required documents must be approved by Admin first.');
                                return;
                              }
                              setIsPaymentModalOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '0.375rem',
                              backgroundColor: isStage1Done ? 'var(--primary)' : '#cbd5e1',
                              color: 'white',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              cursor: isStage1Done ? 'pointer' : 'not-allowed'
                            }}
                          >
                            <CreditCard size={15} /> {isStage1Done ? 'Record / Verify Payment' : 'Locked (Docs Approval Required)'}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!isStage1Done}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isStage1Done) {
                              toast.error('Please approve required documents before requesting payment.');
                              return;
                            }
                            setIsSendPaymentRequestModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.375rem',
                            backgroundColor: isStage1Done ? '#0284c7' : '#cbd5e1',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            cursor: isStage1Done ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Mail size={15} /> Send Payment Request (Email & WhatsApp)
                        </button>
                      </div>
                    )}

                    {idx === 3 && !isStage3Done && (
                      <button
                        type="button"
                        disabled={!isStage2Done}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isStage2Done) {
                            toast.error('Site Visit locked: Stage 3 (Payment) must be completed first.');
                            return;
                          }
                          setIsSiteVisitModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.375rem',
                          backgroundColor: isStage2Done ? (isAdmin ? '#7c3aed' : 'var(--primary)') : '#cbd5e1',
                          color: 'white',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: isStage2Done ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <MapPin size={15} /> {isStage2Done ? (isAdmin ? 'Confirm Site Visit Completion' : 'Submit Inspection Report') : 'Locked (Payment Required)'}
                      </button>
                    )}

                    {idx === 4 && isAdmin && !isStage4Done && (
                      <button
                        type="button"
                        disabled={!isStage0Done || !isStage1Done || !isStage2Done || !isStage3Done}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isStage0Done || !isStage1Done || !isStage2Done || !isStage3Done) {
                            toast.error('Stages 1 to 4 must all be completed before granting Final Approval.');
                            return;
                          }
                          handleGrantFinalApproval();
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 1rem',
                          borderRadius: '0.375rem',
                          backgroundColor: (isStage0Done && isStage1Done && isStage2Done && isStage3Done) ? '#059669' : '#cbd5e1',
                          color: 'white',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          cursor: (isStage0Done && isStage1Done && isStage2Done && isStage3Done) ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <ShieldCheck size={16} /> Issue Sanction & Mark Finally Approved
                      </button>
                    )}
                  </div>

                  {/* Dates & Responsible Person */}
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div>
                      Started Date: <strong style={{ color: 'var(--text-primary)' }}>
                        {stage.startedDate ? new Date(stage.startedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </strong>
                    </div>
                    <div>
                      Completed Date: <strong style={{ color: isCompleted ? '#059669' : 'var(--text-primary)' }}>
                        {stage.completedDate ? new Date(stage.completedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}
                      </strong>
                    </div>
                    <div>
                      Responsible: <strong style={{ color: 'var(--text-primary)' }}>{stage.responsiblePerson || 'Admin / Officer'}</strong>
                    </div>
                  </div>

                  {/* Remarks */}
                  {stage.remarks && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem', fontSize: '0.8125rem', color: 'var(--primary-dark)', fontStyle: 'italic' }}>
                      “{stage.remarks}”
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Uploaded Documents Section */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
              Customer Uploaded Documents
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Verified document checklist for application #{proposalNumber}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleShareWhatsApp}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '0.375rem',
                backgroundColor: '#25D366',
                border: 'none',
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title="Share document upload link via WhatsApp"
            >
              <MessageCircle size={14} /> Send WhatsApp Link
            </button>
            {isAdmin && !allDocsApproved && (
              <button
                onClick={handleApproveAllDocs}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '0.375rem',
                  backgroundColor: '#059669',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Admin Approve all uploaded documents at once"
              >
                <CheckCircle2 size={14} /> Approve All Documents
              </button>
            )}
            <Link
              to={isAdmin ? '/admin/documents' : '/employee/documents'}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Open All Documents Tab →
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {documentList.map(doc => {
            const fileUrl = uploadedFiles[doc.key] || (doc.altKey && uploadedFiles[doc.altKey]);
            const verData = docVerification[doc.key] || (doc.altKey && docVerification[doc.altKey]) || {};
            const status = verData.status || (fileUrl ? 'Pending Review' : 'Missing');

            return (
              <div 
                key={doc.key}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: fileUrl ? 'var(--bg-surface)' : '#fef2f2',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{doc.label}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '1rem',
                      backgroundColor: status === 'Verified' ? '#dcfce7' : status === 'Worker Verified' ? '#dbeafe' : status === 'Pending Review' ? '#fef3c7' : '#fee2e2',
                      color: status === 'Verified' ? '#166534' : status === 'Worker Verified' ? '#1e40af' : status === 'Pending Review' ? '#b45309' : '#b91c1c'
                    }}>
                      {status === 'Verified' ? 'Admin Approved ✓' : status === 'Worker Verified' ? 'Worker Verified (Pending Admin)' : status}
                    </span>
                    {verData.verifiedBy && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        By: {verData.verifiedBy}
                      </span>
                    )}
                  </div>
                  {verData.reuploadReason && (
                    <div style={{ color: '#b91c1c', fontSize: '0.725rem', marginTop: '0.25rem' }}>
                      Note: {verData.reuploadReason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {fileUrl ? (
                    <>
                      <button
                        onClick={() => setPreviewDoc({ title: doc.label, url: fileUrl })}
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: '0.25rem',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                        title="Preview Document"
                      >
                        <Eye size={13} /> View
                      </button>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{
                          padding: '0.35rem 0.6rem',
                          borderRadius: '0.25rem',
                          backgroundColor: 'var(--primary)',
                          border: 'none',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                        title="Download Document"
                      >
                        <Download size={13} />
                      </a>

                      {/* Worker verification button */}
                      {!isAdmin && status !== 'Verified' && status !== 'Worker Verified' && (
                        <button
                          onClick={() => handleVerifySingleDoc(doc.key, 'Worker Verified')}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.25rem',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Mark Document as Worker Verified"
                        >
                          <Check size={13} /> Verify
                        </button>
                      )}

                      {/* Admin approval button */}
                      {isAdmin && status !== 'Verified' && (
                        <button
                          onClick={() => handleVerifySingleDoc(doc.key, 'Verified')}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.25rem',
                            backgroundColor: '#059669',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Approve Document (Admin)"
                        >
                          <ShieldCheck size={13} /> Approve
                        </button>
                      )}

                      {/* Admin Request Re-upload button */}
                      {isAdmin && status !== 'Re-upload Required' && (
                        <button
                          onClick={() => {
                            const reason = window.prompt(`Specify reason for re-uploading ${doc.label}:`);
                            if (reason && reason.trim()) {
                              handleVerifySingleDoc(doc.key, 'Re-upload Required');
                            }
                          }}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.25rem',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fca5a5',
                            color: '#b91c1c',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Request Re-upload"
                        >
                          <AlertCircle size={13} /> Re-upload
                        </button>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
                      Missing
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Update Stage Modal */}
      {isUpdateModalOpen && (
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
            width: '540px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              backgroundColor: 'var(--primary-dark)',
              color: 'white',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Update Application Stage
                </h3>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>
                  Admin Authorization • Proposal #{proposalNumber}
                </div>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStageUpdate} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Select Target Stage:
                </label>
                <select
                  value={targetStageIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setTargetStageIndex(idx);
                    const st = stages[idx];
                    setNewStageStatus(st ? st.status : 'Completed');
                    setStageRemarks(st ? st.remarks : '');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {STAGE_NAMES.map((name, i) => (
                    <option key={i} value={i}>
                      {i + 1}. {name} {stages[i]?.status === 'Completed' ? '✓' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Set Stage Status:
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {(['Completed', 'In Progress', 'Pending'] as const).map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewStageStatus(s)}
                      style={{
                        flex: 1,
                        padding: '0.625rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: newStageStatus === s ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: newStageStatus === s ? 'rgba(30, 58, 138, 0.08)' : 'var(--bg-surface)',
                        color: newStageStatus === s ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        cursor: 'pointer'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Stage Remarks / Officer Notes:
                </label>
                <textarea
                  rows={3}
                  value={stageRemarks}
                  onChange={(e) => setStageRemarks(e.target.value)}
                  placeholder="Enter remarks, inspection findings, or sanction details..."
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {targetStageIndex === 4 && newStageStatus === 'Completed' && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '0.375rem', border: '1px solid #a7f3d0', fontSize: '0.8125rem', color: '#065f46' }}>
                  <strong>Note:</strong> Marking Stage 5 (Final Approval) as Completed will issue the official sanction and automatically send the branded Application Completion Email to customer <strong>{property.owner_email || fullData.email}</strong> via Brevo notification service.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
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
                  disabled={isUpdatingStage}
                  className="btn-primary"
                  style={{
                    padding: '0.625rem 1.75rem',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isUpdatingStage ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isUpdatingStage ? 'Updating...' : 'Save & Advance Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '480px',
            maxWidth: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              backgroundColor: 'var(--primary-dark)',
              color: 'white',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Record / Verify Payment</h3>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>
                  Stage 3 Payment • Proposal #{proposalNumber}
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Payment Amount (₹):
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Payment Method:
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="UPI / QR Code">UPI / QR Code (PhonePe, GPay, Paytm)</option>
                  <option value="Bank Transfer / NEFT / RTGS">Bank Transfer / NEFT / RTGS</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cash">Cash at Office</option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  {payMethod === 'Cash' ? (
                    'Cash Receipt / Voucher No (Optional):'
                  ) : (
                    <>Transaction ID / UTR Number <span style={{ color: '#dc2626' }}>*</span>:</>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={payMethod === 'Cash' ? 'e.g. CASH-101 (auto-generated if left blank)' : 'e.g. UPI-20261101987654 or UTR12345678'}
                  value={payTxId}
                  onChange={(e) => setPayTxId(e.target.value)}
                  required={payMethod !== 'Cash'}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.875rem'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                  {payMethod === 'Cash' 
                    ? 'For cash payments collected at office, receipt number is auto-generated if left blank.' 
                    : 'System checks against duplicate transaction IDs across all cases.'}
                </span>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Payment Remarks / Notes:
                </label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional payment notes or branch details..."
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
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
                  disabled={isSavingPayment}
                  className="btn-primary"
                  style={{
                    padding: '0.625rem 1.5rem',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isSavingPayment ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSavingPayment ? 'Recording...' : 'Verify & Unlock Site Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Payment Request Modal */}
      {isSendPaymentRequestModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '0.75rem',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0284c7',
              color: 'white'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Request Customer Payment</h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  Send official email & WhatsApp with UPI QR code & bank details • #{proposalNumber}
                </span>
              </div>
              <button
                onClick={() => setIsSendPaymentRequestModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem', backgroundColor: '#f0f9ff', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 600 }}>
                  Recipient Customer:
                </div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.2rem' }}>
                  {property.owner_name || fullData.customerName || 'Customer'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>📧 {property.owner_email || fullData.email || 'No email on file'}</span>
                  <span>📱 {property.owner_phone || fullData.mobile || 'No phone'}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Fee Amount to Request (₹):
                </label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Company Payment Info Preview */}
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <QrCode size={14} color="var(--primary)" /> Payment Details to be Sent
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--primary-dark)', lineHeight: 1.5 }}>
                  <div>• UPI ID: <strong>{bankSettings?.upiId || 'cbconstruction@upi'}</strong></div>
                  {bankSettings?.accountNumber && (
                    <div>• Bank: <strong>{bankSettings.bankName || 'HDFC Bank'}</strong> | A/C: <strong>{bankSettings.accountNumber}</strong> (IFSC: {bankSettings.ifsc})</div>
                  )}
                  <div>• QR Code: <strong>{bankSettings?.qrCodeUrl ? '✓ Official Company QR Code attached' : 'Standard UPI attached'}</strong></div>
                  <div>• Cash Option: <strong>✓ Noted as accepted at office with instant receipt</strong></div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Custom Message / Note to Customer (Optional):
                </label>
                <textarea
                  rows={2}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="e.g. Please make payment so our field officer can schedule the site inspection visit..."
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsSendPaymentRequestModalOpen(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPaymentRequest('whatsapp')}
                  disabled={isSendingPaymentRequest}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPaymentRequest('email')}
                  disabled={isSendingPaymentRequest}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isSendingPaymentRequest ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Mail size={16} /> {isSendingPaymentRequest ? 'Sending...' : 'Send Official Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Visit Modal */}
      {isSiteVisitModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '500px',
            maxWidth: '100%',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              backgroundColor: 'var(--primary-dark)',
              color: 'white',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  {isAdmin ? 'Confirm Site Visit Inspection' : 'Submit Site Visit Report'}
                </h3>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>
                  Stage 4 Site Visit • Proposal #{proposalNumber}
                </div>
              </div>
              <button
                onClick={() => setIsSiteVisitModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Inspection / Visit Date:
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                  Field Inspector Observations & Site Findings:
                </label>
                <textarea
                  rows={4}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="Record site inspection findings: road width, physical setbacks, boundary markers verified, no encroachment..."
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSiteVisitModalOpen(false)}
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
                  type="button"
                  disabled={isSavingSiteVisit}
                  onClick={() => handleSaveSiteVisit(isAdmin)}
                  className="btn-primary"
                  style={{
                    padding: '0.625rem 1.5rem',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isSavingSiteVisit ? 'not-allowed' : 'pointer',
                    backgroundColor: isAdmin ? '#059669' : 'var(--primary)'
                  }}
                >
                  {isSavingSiteVisit ? 'Saving...' : isAdmin ? 'Confirm Completion & Unlock Final Approval' : 'Submit Report for Admin Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
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
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{previewDoc.title}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '75vh', overflow: 'auto' }}>
              {previewDoc.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || previewDoc.url.startsWith('data:image/') ? (
                <img src={previewDoc.url} alt={previewDoc.title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
              ) : previewDoc.url.match(/\.pdf($|\?)/i) || previewDoc.url.startsWith('data:application/pdf') ? (
                <iframe src={previewDoc.url} title={previewDoc.title} style={{ width: '100%', height: '550px', border: 'none' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                  <p>Document preview available via download or external viewer.</p>
                  <a
                    href={previewDoc.url}
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

export default ApplicationView;
