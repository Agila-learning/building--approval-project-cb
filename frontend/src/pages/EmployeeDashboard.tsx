import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Clock, AlertCircle, FileText, 
  Phone, Plus, Calendar as CalendarIcon, 
  ArrowRight, PhoneCall, MessageCircle, FileUp
} from 'lucide-react';
import { getEmployeeFollowUps, updateFollowUpStatus } from '../utils/employeeUtils';
import type { EmployeeFollowUp } from '../utils/employeeUtils';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      const res = await fetch(`${apiUrl}/cases`);
      if (res.ok) {
        const casesData = await res.json();
        const mappedApps = casesData.map((c: any) => ({
          id: c.id,
          customer: c.property?.owner_name || 'Unknown',
          mobile: c.property?.owner_phone || '',
          location: c.property?.jurisdiction || c.property?.village || '',
          type: 'Building',
          appType: c.approval_type,
          status: c.status,
          assignedTo: c.assigned_staff?.name || 'Unassigned',
          date: new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        })).filter((app: any) => app.assignedTo === user);
        
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

  const loadTodayAttendance = (user: string) => {
    const today = new Date().toISOString().split('T')[0];
    const attendanceRecords = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
    const todayRecord = attendanceRecords.find((r: any) => r.name === user && r.date === today);
    if (todayRecord) {
      if (todayRecord.checkIn !== '--') {
        setHasCheckedIn(true);
        setCheckInTime(todayRecord.checkIn);
      }
      if (todayRecord.checkOut !== '--') {
        setHasCheckedOut(true);
        setCheckOutTime(todayRecord.checkOut);
      }
    }
  };

  const updateAttendance = (type: 'checkIn' | 'checkOut') => {
    const today = new Date().toISOString().split('T')[0];
    const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    let attendanceRecords = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
    let recordIndex = attendanceRecords.findIndex((r: any) => r.name === employeeName && r.date === today);
    
    if (recordIndex >= 0) {
      if (type === 'checkIn') attendanceRecords[recordIndex].checkIn = timeString;
      if (type === 'checkOut') attendanceRecords[recordIndex].checkOut = timeString;
      attendanceRecords[recordIndex].status = 'Present';
    } else {
      attendanceRecords.push({
        id: employeeId,
        name: employeeName,
        role: 'Staff Member',
        date: today,
        checkIn: type === 'checkIn' ? timeString : '--',
        checkOut: type === 'checkOut' ? timeString : '--',
        status: 'Present',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&background=0D8ABC&color=fff`
      });
    }
    
    localStorage.setItem('employeeAttendance', JSON.stringify(attendanceRecords));
    window.dispatchEvent(new Event('storage'));
    loadTodayAttendance(employeeName);
  };

  // Compute metrics
  const activeApps = applications.filter(a => a.status !== 'Approved' && a.status !== 'Rejected').length;
  const inProgressApps = applications.filter(a => a.status === 'In Progress' || a.status === 'Verification').length;
  const pendingDocs = applications.filter(a => a.status === 'Documents Pending').length;
  const completedApps = applications.filter(a => a.status === 'Approved').length;
  
  // Get 4 apps that need attention (e.g. not approved/rejected, maybe pending docs)
  const actionRequiredApps = applications.filter(a => a.status !== 'Approved' && a.status !== 'Rejected').slice(0, 4);

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>{app.id}</div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>{app.customer}</h4>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
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
                      <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }} onClick={() => navigate(`/employee/applications/${app.id}`)}>
                        Process Application
                      </button>
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
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)', border: '1px dashed var(--primary)' }} onClick={() => navigate('/employee/applications/new')}>
                <Plus size={18} color="var(--primary)" /> New Application
              </button>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                <FileUp size={18} color="#8b5cf6" /> Upload Document
              </button>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                <CalendarIcon size={18} color="var(--warning-gold)" /> Schedule Inspection
              </button>
              <button className="card hover-effect" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                <PhoneCall size={18} color="var(--success-green)" /> Create Follow-up
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
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Apps processed this week</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active applications</span>
                  <span style={{ fontWeight: 700, color: 'var(--warning-gold)' }}>{activeApps}</span>
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
    </div>
  );
};

export default EmployeeDashboard;
