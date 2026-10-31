import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Pencil, CheckCircle2, Clock, AlertCircle, Calendar, 
  User, Building2, MapPin, FileText, Download, Eye, ExternalLink,
  ShieldCheck, ShieldAlert, ArrowRight, UserCheck, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

interface StageRecord {
  id: number;
  name: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  startedDate: string | null;
  completedDate: string | null;
  remarks: string;
  responsiblePerson: string;
}

const STAGE_NAMES = [
  'Application Submitted',
  'Document Verification',
  'Payment Process',
  'Site Visit',
  'Final Review',
  'Application Completed'
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

  const stages: StageRecord[] = caseRecord.stages || [];
  const fullData = caseRecord.fullData || {};
  const property = caseRecord.property || {};
  const proposalNumber = caseRecord.application_number || id;
  const currentStatus = caseRecord.status || 'Application Submitted';
  const assignedStaffName = caseRecord.assigned_staff?.name || fullData.staff || 'Unassigned';

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

  const documentList = [
    { key: 'CUSTOMER PHOTOGRAPH', label: 'Customer Photograph' },
    { key: 'CUSTOMER SIGNATURE', label: 'Customer Signature' },
    { key: 'AADHAR CARD', label: 'Aadhaar Card' },
    { key: 'PAN CARD', label: 'PAN Card' },
    { key: 'SALE DEED', altKey: 'LAND DOCUMENT', label: 'Sale Deed / Land Document' },
    { key: 'PATTA', label: 'Patta Copy' },
    { key: 'BUILDING PLAN', label: 'Building Plan' },
  ];

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
                backgroundColor: currentStatus === 'Application Completed' ? '#dcfce7' : currentStatus === 'Application Submitted' ? '#dbeafe' : '#fef3c7',
                color: currentStatus === 'Application Completed' ? '#166534' : currentStatus === 'Application Submitted' ? '#1e40af' : '#b45309',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                {currentStatus}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Stage-Wise Progress Tracking & Real-Time Verification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
        <div className="card" style={{ padding: '1.25rem' }}>
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
                Reassign Worker:
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

      {/* Main Section: The 6 Stages Progress Timeline */}
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
              Click any stage below to update status & remarks
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
                  padding: '1rem',
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
                        Click to Update →
                      </span>
                    )}
                  </div>

                  {/* Dates & Responsible Person */}
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.625rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
                      backgroundColor: status === 'Verified' ? '#dcfce7' : status === 'Pending Review' ? '#e0f2fe' : '#fee2e2',
                      color: status === 'Verified' ? '#166534' : status === 'Pending Review' ? '#0369a1' : '#b91c1c'
                    }}>
                      {status}
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

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {fileUrl ? (
                    <>
                      <button
                        onClick={() => setPreviewDoc({ title: doc.label, url: fileUrl })}
                        style={{
                          padding: '0.4rem 0.6rem',
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
                          padding: '0.4rem 0.6rem',
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

              {targetStageIndex === 5 && newStageStatus === 'Completed' && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: '0.375rem', border: '1px solid #a7f3d0', fontSize: '0.8125rem', color: '#065f46' }}>
                  <strong>Note:</strong> Marking Stage 6 (Application Completed) as Completed will automatically send the branded Application Completion Email to customer <strong>{property.owner_email || fullData.email}</strong> via Brevo notification service.
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
