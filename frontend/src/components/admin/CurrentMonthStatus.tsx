import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, Activity, CheckCircle, XCircle } from 'lucide-react';
import { getApplicationStatus } from '../../utils/statusHelper';

const CurrentMonthStatus: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ Received: 0, InProgress: 0, Approved: 0, Rejected: 0 });

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/cases`);
        let apps: any[] = [];
        if (res.ok) {
          apps = await res.json();
        }

        const localCasesStr = localStorage.getItem('mock_saved_cases');
        const localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];
        const allApps = [...apps, ...localCases].filter((app: any, index: number, self: any[]) => 
          index === self.findIndex((a: any) => (a.application_number || a.id) === (app.application_number || app.id))
        );

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthApps = allApps.filter(app => {
          let appDate: Date | null = null;
          if (app.created_at) appDate = new Date(app.created_at);
          else if (app.createdAt) appDate = new Date(app.createdAt);
          else if (app.date && !isNaN(new Date(app.date).getTime())) appDate = new Date(app.date);
          
          if (!appDate || isNaN(appDate.getTime())) return false;
          return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
        });

        const newCounts = { Received: currentMonthApps.length, InProgress: 0, Approved: 0, Rejected: 0 };

        currentMonthApps.forEach(app => {
          const rawStatus = app.status ? app.status.toUpperCase() : '';
          const mappedStatus = getApplicationStatus(app.application_number || app.id, app.status);
          
          if (mappedStatus === 'Approved' || rawStatus === 'APPROVED' || rawStatus === 'COMPLETED') {
            newCounts.Approved++;
          } else if (mappedStatus === 'Rejected' || rawStatus === 'REJECTED') {
            newCounts.Rejected++;
          } else {
            newCounts.InProgress++;
          }
        });

        setCounts(newCounts);
      } catch (err) {
        console.error("Failed to fetch cases for current month status:", err);
      }
    };

    fetchCases();
    window.addEventListener('storage', fetchCases);
    return () => window.removeEventListener('storage', fetchCases);
  }, []);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[new Date().getMonth()];

  const statusCards = [
    { name: 'Total Received', count: counts.Received, icon: <FilePlus size={20} strokeWidth={1.5} />, color: 'var(--primary)', bgColor: 'rgba(23, 37, 84, 0.05)', path: '/admin/applications?filter=current_month' },
    { name: 'In Progress', count: counts.InProgress, icon: <Activity size={20} strokeWidth={1.5} />, color: 'var(--warning)', bgColor: 'rgba(214, 167, 86, 0.1)', path: '/admin/applications?filter=current_month&status=active' },
    { name: 'Approved', count: counts.Approved, icon: <CheckCircle size={20} strokeWidth={1.5} />, color: 'var(--success-green)', bgColor: 'rgba(47, 125, 90, 0.1)', path: '/admin/applications?filter=current_month&status=approved' },
    { name: 'Rejected', count: counts.Rejected, icon: <XCircle size={20} strokeWidth={1.5} />, color: 'var(--accent)', bgColor: 'rgba(201, 106, 74, 0.1)', path: '/admin/applications?filter=current_month&status=rejected' },
  ];

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>Current Month Status</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overview of applications for {currentMonthName} {new Date().getFullYear()}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
        {statusCards.map((status, index) => (
          <div
            key={index}
            onClick={() => navigate(status.path)}
            role="button"
            tabIndex={0}
            title={`Filter applications: ${status.name} (${status.count})`}
            style={{ 
              display: 'flex', flexDirection: 'column', padding: '1rem', 
              borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-secondary)',
              borderLeft: `3px solid ${status.color}`,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: status.color }}>
              {status.icon}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{status.name}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-dark)' }}>
              {status.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentMonthStatus;
