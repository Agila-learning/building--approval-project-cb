import React, { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle2, XCircle } from 'lucide-react';
import { getApiUrl } from '../../config/api';

const EmployeeAttendance: React.FC = () => {
  const [employeeName, setEmployeeName] = useState('Employee');
  const [myAttendance, setMyAttendance] = useState<any[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser') || 'Employee';
    setEmployeeName(user);
    
    // 1. Initial local load
    const records = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
    const userRecords = records.filter((r: any) => r.name?.toLowerCase() === user.toLowerCase());
    userRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMyAttendance(userRecords);

    // 2. Load from backend API
    const fetchApiAttendance = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/attendance?staffName=${encodeURIComponent(user)}`);
        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            // Merge with local records
            const merged = [...apiData];
            records.forEach((lr: any) => {
              if (lr.name?.toLowerCase() === user.toLowerCase() && !merged.some(m => m.date === lr.date)) {
                merged.push(lr);
              }
            });
            merged.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setMyAttendance(merged);
          }
        }
      } catch (err) {
        console.warn('Could not fetch attendance from API:', err);
      }
    };

    fetchApiAttendance();
  }, []);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
          My Attendance
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          View check-in and check-out logs for {employeeName}.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Check In</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {myAttendance.length > 0 ? (
                myAttendance.map((record, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      {record.date}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backgroundColor: record.status === 'Present' ? 'rgba(34, 160, 107, 0.1)' : 'rgba(185, 74, 72, 0.1)', 
                        color: record.status === 'Present' ? 'var(--success-green)' : 'var(--error-red)' 
                      }}>
                        {record.status === 'Present' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {record.checkIn}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {record.checkOut}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <CalendarClock size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No attendance records</h3>
                      <p>You haven't checked in yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
