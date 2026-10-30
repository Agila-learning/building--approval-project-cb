import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, ShieldCheck, KeyRound, 
  CheckCircle2, Clock, FileText, CalendarClock, 
  LogOut, AlertCircle, Save, Award, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const EmployeeProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // User Profile State
  const [userId, setUserId] = useState('');
  const [staffId, setStaffId] = useState('EMP-001');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');
  const [status, setStatus] = useState('Active');

  // Performance stats
  const [assignedCasesCount, setAssignedCasesCount] = useState(0);
  const [approvedCasesCount, setApprovedCasesCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [followUpsCount, setFollowUpsCount] = useState(0);

  // Today's attendance
  const [todayAttendance, setTodayAttendance] = useState<{ checkIn: string; checkOut: string; status: string }>({
    checkIn: '--',
    checkOut: '--',
    status: 'Not Marked'
  });

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchProfileAndStats = async () => {
    setLoading(true);
    try {
      const loggedInUser = localStorage.getItem('loggedInUser') || 'Employee';
      const apiUrl = getApiUrl();

      // 1. Fetch Users
      try {
        const userRes = await fetch(`${apiUrl}/users`);
        if (userRes.ok) {
          const users = await userRes.json();
          const current = users.find((u: any) => 
            u.name.toLowerCase() === loggedInUser.toLowerCase() ||
            (u.email && u.email.toLowerCase() === loggedInUser.toLowerCase()) ||
            u.staffId === localStorage.getItem('staffId')
          );

          if (current) {
            setUserId(current.id);
            setStaffId(current.staffId || 'EMP-001');
            setName(current.name);
            setMobile(current.mobile || current.phone || '');
            setEmail(current.email || '');
            setRole(current.role || 'STAFF');
            setStatus(current.status || 'Active');
          } else {
            setName(loggedInUser);
          }
        }
      } catch (e) {
        console.warn("Could not fetch user list:", e);
        setName(loggedInUser);
      }

      // 2. Fetch Cases assigned to this employee
      try {
        const staffIdVal = localStorage.getItem('staffId') || '';
        const casesRes = await fetch(`${apiUrl}/cases?role=STAFF&staffName=${encodeURIComponent(loggedInUser)}&staffId=${encodeURIComponent(staffIdVal)}`, {
          headers: {
            'x-user-role': 'STAFF',
            'x-user-name': loggedInUser,
            'x-staff-id': staffIdVal
          }
        });
        if (casesRes.ok) {
          const cases = await casesRes.json();
          setAssignedCasesCount(cases.length);

          const approved = cases.filter((c: any) => {
            const st = (c.status || '').toUpperCase();
            return st === 'APPROVED' || st === 'COMPLETED';
          }).length;
          setApprovedCasesCount(approved);

          const inProg = cases.filter((c: any) => {
            const st = (c.status || '').toUpperCase();
            return st !== 'APPROVED' && st !== 'COMPLETED' && st !== 'REJECTED';
          }).length;
          setInProgressCount(inProg);
        }
      } catch (e) {
        console.warn("Could not fetch staff cases:", e);
      }

      // 3. Followups Count
      try {
        const leadsRes = await fetch(`${apiUrl}/leads`);
        if (leadsRes.ok) {
          const leads = await leadsRes.json();
          const myLeads = leads.filter((l: any) => (l.assignedTo || '').toLowerCase() === loggedInUser.toLowerCase());
          setFollowUpsCount(myLeads.length);
        }
      } catch (e) {
        console.warn("Could not fetch leads:", e);
      }

      // 4. Attendance
      const today = new Date().toISOString().split('T')[0];
      const records = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
      const todayRec = records.find((r: any) => r.name === loggedInUser && r.date === today);
      if (todayRec) {
        setTodayAttendance({
          checkIn: todayRec.checkIn || '--',
          checkOut: todayRec.checkOut || '--',
          status: todayRec.status || 'Present'
        });
      }

    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      const apiUrl = getApiUrl();
      if (userId) {
        const res = await fetch(`${apiUrl}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            mobile: mobile.trim(),
            email: email.trim() || null,
            status,
            role
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update profile');
        }
      }

      localStorage.setItem('loggedInUser', name.trim());
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setChangingPass(true);
    try {
      const apiUrl = getApiUrl();
      if (userId) {
        const res = await fetch(`${apiUrl}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: newPassword
          })
        });

        if (!res.ok) {
          throw new Error('Failed to change password');
        }
      }

      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error changing password');
    } finally {
      setChangingPass(false);
    }
  };

  const getInitials = (n: string) => {
    if (!n) return 'EM';
    return n.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  };

  const completionRate = assignedCasesCount > 0 
    ? Math.round((approvedCasesCount / assignedCasesCount) * 100) 
    : 0;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0b63ce 0%, #064089 100%)', color: '#fff', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              {getInitials(name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#fff' }}>{name || 'Staff Member'}</h1>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}>
                  {staffId}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span>Role: <strong>{role}</strong></span>
                {email && <span>• {email}</span>}
                {mobile && <span>• {mobile}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchProfileAndStats}
              title="Refresh Profile"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={() => { localStorage.removeItem('loggedInUser'); localStorage.removeItem('token'); window.location.href = '/login'; }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                border: 'none',
                color: '#fff',
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(11, 99, 206, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Projects</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{assignedCasesCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>In Progress</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{inProgressCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Approved & Done</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{approvedCasesCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Completion Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{completionRate}%</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Details Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" /> Personal & Contact Details
          </h2>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>Staff ID</label>
              <input
                type="text"
                value={staffId}
                disabled
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10 digit mobile"
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>Role</label>
              <input
                type="text"
                value={role}
                disabled
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
              />
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', fontWeight: 600 }}
              >
                <Save size={18} /> {savingProfile ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Attendance & Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Today's Attendance Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarClock size={20} color="var(--primary)" /> Today's Attendance
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Check In</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{todayAttendance.checkIn}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Check Out</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.2rem' }}>{todayAttendance.checkOut}</div>
              </div>
            </div>
            <a
              href="/employee/attendance"
              style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              View Full Attendance History →
            </a>
          </div>

          {/* Change Password Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={20} color="var(--primary)" /> Change Password
            </h2>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#fff' }}
                />
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={changingPass}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    fontWeight: 600,
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ShieldCheck size={18} /> {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
