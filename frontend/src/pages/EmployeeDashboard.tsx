import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Clock, AlertCircle, FileText, 
  Phone, Plus, Calendar as CalendarIcon, 
  ArrowRight, PhoneCall, MessageCircle, FileUp,
  Eye, X, Download
} from 'lucide-react';
import { getEmployeeFollowUps, updateFollowUpStatus } from '../utils/employeeUtils';
import type { EmployeeFollowUp } from '../utils/employeeUtils';
import { getApiUrl } from '../config/api';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('Employee');
  const [employeeId, setEmployeeId] = useState('EMP-000');
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // Attendance states
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<EmployeeFollowUp[]>([]);

  const fetchCases = async (user: string) => {
    try {
      const apiUrl = getApiUrl();
      const staffIdVal = localStorage.getItem('staffId') || '';
      const res = await fetch(`${apiUrl}/cases?role=STAFF&staffName=${encodeURIComponent(user)}&staffId=${encodeURIComponent(staffIdVal)}`, {
        headers: {
          'x-user-role': 'STAFF',
          'x-user-name': user,
          'x-staff-id': staffIdVal
        }
      });
      if (res.ok) {
        const casesData = await res.json();
        const mappedApps = casesData.map((c: any) => ({
          id: c.application_number || c.id,
          mongoId: c.id,
          customer: c.property?.owner_name || (c.fullData as any)?.customerName || 'Unknown',
          mobile: c.property?.owner_phone || (c.fullData as any)?.mobile || '',
          location: c.property?.address || (c.fullData as any)?.propertyDetails?.streetName || c.property?.village || '',
          type: 'Building',
          appType: c.approval_type || (c.fullData as any)?.serviceType || 'Building Approval',
          status: c.status,
          assignedTo: c.assigned_staff?.name || (c.fullData as any)?.staff || 'Assigned',
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
        }));
        
        setApplications(mappedApps);
      }
    } catch (err) {
      console.error("Failed to fetch cases for employee:", err);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser') || 'Employee';
    if (user !== 'Admin') {
      setEmployeeName(user);
      
      const savedStaff = localStorage.getItem('staffMembers');
      if (savedStaff) {
        const staffList = JSON.parse(savedStaff);
        const staff = staffList.find((s: any) => s.name === user);
        if (staff) setEmployeeId(staff.id);
      }
      
      loadTodayAttendance(user);
    }
    
    fetchCases(user);
    setFollowUps(getEmployeeFollowUps(user));

    const interval = setInterval(() => fetchCases(user), 10000);
    return () => clearInterval(interval);
  }, []);

  // Helper status checkers
  const isApproved = (s: string) => ['APPROVED', 'COMPLETED'].includes((s || '').toUpperCase());
  const isRejected = (s: string) => (s || '').toUpperCase() === 'REJECTED';
  const isDocsPending = (s: string) => ['DOCUMENT_COLLECTION', 'DOCUMENTS_PENDING', 'DOCUMENTS PENDING', 'INTAKE', 'ACTION_NEEDED', 'ACTION REQUIRED', 'NEW', 'DRAFT'].includes((s || '').toUpperCase());
  const isVerification = (s: string) => ['DOCUMENTS_VERIFICATION', 'SCRUTINY', 'SITE INSPECTION', 'UNDER REVIEW', 'SUBMITTED', 'SUBMITTED_FOR_APPROVAL', 'VERIFICATION', 'GOV VERIFICATION', 'WORKER VERIFIED'].includes((s || '').toUpperCase());

  // Modal for viewing customer uploaded documents
  const [viewingCaseDocs, setViewingCaseDocs] = useState<any | null>(null);

  const loadTodayAttendance = async (user: string) => {
    const today = new Date().toISOString().split('T')[0];
    // 1. Instant local read
    const localRecords = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
    const localRecord = localRecords.find((r: any) => r.name?.toLowerCase() === user.toLowerCase() && r.date === today);
    if (localRecord) {
      if (localRecord.checkIn && localRecord.checkIn !== '--') {
        setHasCheckedIn(true);
        setCheckInTime(localRecord.checkIn);
      }
      if (localRecord.checkOut && localRecord.checkOut !== '--') {
        setHasCheckedOut(true);
        setCheckOutTime(localRecord.checkOut);
      }
    }

    // 2. Sync with backend API
    try {
      const res = await fetch(`${getApiUrl()}/attendance?date=${today}&staffName=${encodeURIComponent(user)}`);
      if (res.ok) {
        const records = await res.json();
        const apiRecord = Array.isArray(records) && records.length > 0 ? records[0] : null;
        if (apiRecord) {
          if (apiRecord.checkIn && apiRecord.checkIn !== '--') {
            setHasCheckedIn(true);
            setCheckInTime(apiRecord.checkIn);
          }
          if (apiRecord.checkOut && apiRecord.checkOut !== '--') {
            setHasCheckedOut(true);
            setCheckOutTime(apiRecord.checkOut);
          }
          // Merge to local storage
          const updated = localRecords.filter((r: any) => !(r.name?.toLowerCase() === user.toLowerCase() && r.date === today));
          updated.push(apiRecord);
          localStorage.setItem('employeeAttendance', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.warn('Could not sync attendance from backend:', err);
    }
  };

  const updateAttendance = async (type: 'checkIn' | 'checkOut') => {
    const today = new Date().toISOString().split('T')[0];
    const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    let attendanceRecords = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
    let recordIndex = attendanceRecords.findIndex((r: any) => r.name?.toLowerCase() === employeeName.toLowerCase() && r.date === today);
    
    let updatedRecord: any = null;
    if (recordIndex >= 0) {
      if (type === 'checkIn') attendanceRecords[recordIndex].checkIn = timeString;
      if (type === 'checkOut') attendanceRecords[recordIndex].checkOut = timeString;
      attendanceRecords[recordIndex].status = 'Present';
      updatedRecord = attendanceRecords[recordIndex];
    } else {
      updatedRecord = {
        id: employeeId || `EMP-${employeeName.replace(/\s+/g, '')}`,
        name: employeeName,
        role: 'Staff Member',
        date: today,
        checkIn: type === 'checkIn' ? timeString : '--',
        checkOut: type === 'checkOut' ? timeString : '--',
        status: 'Present',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&background=0D8ABC&color=fff`
      };
      attendanceRecords.push(updatedRecord);
    }
    
    localStorage.setItem('employeeAttendance', JSON.stringify(attendanceRecords));
    window.dispatchEvent(new Event('storage'));
    
    if (type === 'checkIn') {
      setHasCheckedIn(true);
      setCheckInTime(timeString);
    } else {
      setHasCheckedOut(true);
      setCheckOutTime(timeString);
    }

    // Sync to backend API for admin dashboard reflection
    try {
      await fetch(`${getApiUrl()}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'STAFF',
          'x-user-name': employeeName,
          'x-staff-id': employeeId
        },
        body: JSON.stringify({
          id: employeeId,
          name: employeeName,
          role: 'Staff Member',
          date: today,
          type,
          checkIn: updatedRecord.checkIn,
          checkOut: updatedRecord.checkOut,
          status: 'Present'
        })
      });
    } catch (err) {
      console.warn('Failed to sync attendance to backend:', err);
    }
  };

  // Compute metrics with comprehensive status categorization
  const activeApps = applications.filter(a => !isApproved(a.status) && !isRejected(a.status)).length;
  const inProgressApps = applications.filter(a => isVerification(a.status) || (!isApproved(a.status) && !isRejected(a.status) && !isDocsPending(a.status))).length;
  const pendingDocs = applications.filter(a => isDocsPending(a.status)).length;
  const completedApps = applications.filter(a => isApproved(a.status)).length;
  
  // Get applications that need staff attention
  const actionRequiredApps = applications.filter(a => !isApproved(a.status) && !isRejected(a.status)).slice(0, 6);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Welcome Section */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
            Good morning, {employeeName}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Here's what needs your attention today. &nbsp; • &nbsp; <span style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>{todayDate}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {hasCheckedIn ? (
            <div style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> In: {checkInTime}
            </div>
          ) : (
            <button className="btn-primary" onClick={() => updateAttendance('checkIn')} style={{ padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Mark Check-in
            </button>
          )}

          {hasCheckedIn && !hasCheckedOut && (
            <button onClick={() => updateAttendance('checkOut')} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--warning-gold)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Mark Check-out
            </button>
          )}

          {hasCheckedOut && (
            <div style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Out: {checkOutTime}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Active Applications', value: activeApps, icon: <FileText size={24} color="var(--primary)" />, bg: 'rgba(30, 58, 138, 0.05)', path: '/employee/applications' },
          { label: 'In Progress', value: inProgressApps, icon: <Clock size={24} color="var(--warning-gold)" />, bg: 'rgba(214, 167, 86, 0.1)', path: '/employee/applications' },
          { label: 'Pending Docs', value: pendingDocs, icon: <AlertCircle size={24} color="var(--error-red)" />, bg: 'rgba(185, 74, 72, 0.1)', path: '/employee/applications' },
          { label: 'Approved', value: completedApps, icon: <CheckCircle2 size={24} color="var(--success-green)" />, bg: 'rgba(47, 125, 90, 0.1)', path: '/employee/applications' },
        ].map((card, idx) => (
          <div 
            key={idx} 
            className="card hover-effect" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
            onClick={() => navigate(card.path)}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', lineHeight: 1.2 }}>{card.value}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Action Required */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Action Required (My Applications)</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => navigate('/employee/applications')}>
                View All <ArrowRight size={16} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {actionRequiredApps.length > 0 ? actionRequiredApps.map(app => (
                <div key={app.id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${app.status === 'Documents Pending' ? 'var(--error-red)' : 'var(--warning-gold)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>{app.id}</div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>{app.customer}</h4>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span><span style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>Type:</span> {app.appType || 'Building'}</span>
                        <span><span style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>Location:</span> {app.location}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                          {app.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Date: {app.date}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                        {app.mobile && (
                          <button
                            onClick={() => {
                              const cleanMobile = (app.mobile || '').replace(/\D/g, '').slice(-10);
                              const uploadUrl = `${window.location.origin}/upload/${app.id}`;
                              const text = `Dear ${app.customer},\n\nGreetings from C.B. Building Approvals.\nYour building approval application (${app.id}) is in progress. Please upload your required documents using your secure personal link below:\n\n${uploadUrl}\n\nRequired documents checklist:\n1. Customer Photo & Signature\n2. Aadhar Card & PAN Card\n3. Land Document / Sale Deed\n4. Patta & FMB Copy\n5. Proposed Building Plan\n\nThank you!\nCB Building Approvals`;
                              window.open(`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            title="Share Upload Link via WhatsApp"
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
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingCaseDocs(app)}
                          title="View customer uploaded documents"
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--primary-dark)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Eye size={14} /> View Docs
                        </button>
                        <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }} onClick={() => navigate(`/employee/applications/${app.id}`)}>
                          Process Application
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No applications require your attention right now.
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)', border: '1px dashed var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/employee/applications/new')}>
                <Plus size={18} color="var(--primary)" /> New Application
              </button>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer' }} onClick={() => navigate('/employee/applications')}>
                <FileUp size={18} color="#8b5cf6" /> View Documents
              </button>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer' }} onClick={() => navigate('/employee/attendance')}>
                <CalendarIcon size={18} color="var(--warning-gold)" /> Attendance History
              </button>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer' }} onClick={() => navigate('/employee/followups')}>
                <PhoneCall size={18} color="var(--success-green)" /> Enquiries & Leads
              </button>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Follow-ups */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Today's Enquiries</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }} onClick={() => navigate('/employee/followups')}>
                View All →
              </button>
            </div>
            <div className="card" style={{ padding: '0' }}>
              {followUps.length > 0 ? followUps.map((fu, idx) => (
                <div key={fu.id} style={{ padding: '1.25rem', borderBottom: idx < followUps.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{fu.customerName}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: fu.status === 'Completed' ? 'rgba(47, 125, 90, 0.1)' : 'rgba(214, 167, 86, 0.1)', color: fu.status === 'Completed' ? 'var(--success-green)' : 'var(--accent)' }}>
                      {fu.status}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600 }}>{fu.applicationId}</span> — {fu.reason}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--error-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {fu.dueTime}
                    </div>
                    {fu.status !== 'Completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--primary)' }} title="Call">
                          <Phone size={14} />
                        </button>
                        <button style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--success-green)' }} title="WhatsApp">
                          <MessageCircle size={14} />
                        </button>
                        <button style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--warning-gold)' }} onClick={() => updateFollowUpStatus(fu.id, 'Completed')} title="Mark Completed">
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No enquiries for today.
                </div>
              )}
            </div>
          </div>

          {/* My Work Summary */}
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>My Work Summary</h3>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Assigned Applications</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{applications.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active applications</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning-gold)' }}>{activeApps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Approved & Completed</span>
                  <span style={{ fontWeight: 700, color: 'var(--success-green)' }}>{completedApps}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending documents</span>
                  <span style={{ fontWeight: 700, color: 'var(--error-red)' }}>{pendingDocs}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Customer Uploaded Documents Modal */}
      {viewingCaseDocs && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', width: '100%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                  Customer Uploaded Documents: {viewingCaseDocs.id}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Applicant: <strong>{viewingCaseDocs.customer}</strong> • Mobile: {viewingCaseDocs.mobile || '—'}
                </p>
              </div>
              <button 
                onClick={() => setViewingCaseDocs(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {(() => {
                const files = viewingCaseDocs.uploadedFiles || {};
                const localDocsStr = localStorage.getItem(`customerDocs_${viewingCaseDocs.id}`);
                const localDocs = localDocsStr ? JSON.parse(localDocsStr) : [];
                
                // Merge files dictionary with local docs
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
                      <p style={{ margin: 0, fontSize: '0.875rem' }}>The customer has not yet uploaded files for this application. You can share the upload link via WhatsApp.</p>
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
                onClick={() => setViewingCaseDocs(null)} 
                style={{ padding: '0.5rem 1.25rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  const targetId = viewingCaseDocs.id;
                  setViewingCaseDocs(null);
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

export default EmployeeDashboard;
