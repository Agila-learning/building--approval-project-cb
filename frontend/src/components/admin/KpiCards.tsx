import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, Building, CheckCircle2, UserCheck } from 'lucide-react';
import { getApplicationStatus } from '../../utils/statusHelper';
import { getApiUrl } from '../../config/api';

const isDocsPending = (status: string) => {
  const s = (status || '').toUpperCase();
  return ['DOCUMENT_COLLECTION', 'ACTION_NEEDED', 'ACTION REQUIRED', 'INTAKE', 'PENDING_DOCUMENTS', 'DOCUMENTS PENDING', 'DRAFT', 'NEW'].includes(s);
};

const isGovReview = (status: string) => {
  const s = (status || '').toUpperCase();
  return ['SUBMITTED', 'SUBMITTED_FOR_APPROVAL', 'SCRUTINY', 'INSPECTION_SCHEDULED', 'INSPECTION_DONE', 'DOCUMENTS_VERIFICATION', 'DOCUMENTS_VERIFIED', 'GOV VERIFICATION', 'UNDER REVIEW', 'SITE INSPECTION', 'VERIFICATION'].includes(s);
};

const isApproved = (status: string) => {
  const s = (status || '').toUpperCase().trim();
  return ['APPROVED', 'COMPLETED', 'FINALLY APPROVED', 'FINAL APPROVAL', 'FINALLY_APPROVED', 'FINAL_APPROVAL', 'APPLICATION COMPLETED', 'SANCTIONED'].includes(s) || s.includes('APPROV') || s.includes('COMPLET');
};

const isRejected = (status: string) => {
  const s = (status || '').toUpperCase().trim();
  return s === 'REJECTED';
};

const KpiCards: React.FC = () => {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState({ total: 0, active: 0, docsPending: 0, govReview: 0, approved: 0 });
  const [staffPresent, setStaffPresent] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const apiUrl = getApiUrl();
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

        const mappedApps = allApps.map((a: any) => {
          const appNo = a.application_number || a.id;
          const status = getApplicationStatus(appNo, a.status, a);
          return { ...a, dynamicStatus: status };
        });

        const total = mappedApps.length;
        const active = mappedApps.filter((a: any) => !isApproved(a.dynamicStatus) && !isRejected(a.dynamicStatus) && !isApproved(a.status) && !isRejected(a.status)).length;
        const docsPending = mappedApps.filter((a: any) => isDocsPending(a.dynamicStatus) || isDocsPending(a.status)).length;
        const govReview = mappedApps.filter((a: any) => isGovReview(a.dynamicStatus) || isGovReview(a.status)).length;
        const approved = mappedApps.filter((a: any) => isApproved(a.dynamicStatus) || isApproved(a.status)).length;

        setKpi({ total, active, docsPending, govReview, approved });

        // Fetch Leads count
        try {
          const leadsRes = await fetch(`${apiUrl}/leads`);
          if (leadsRes.ok) {
            const leadsData = await leadsRes.json();
            setTotalLeads(Array.isArray(leadsData) ? leadsData.length : 0);
          }
        } catch (e) {}

        // Fetch today's attendance count from backend API & local
        const today = new Date().toISOString().split('T')[0];
        let todayPresent = 0;
        try {
          const attRes = await fetch(`${apiUrl}/attendance?date=${today}`);
          if (attRes.ok) {
            const attData = await attRes.json();
            if (Array.isArray(attData)) {
              todayPresent = attData.filter((r: any) => r.status === 'Present').length;
            }
          }
        } catch (e) {}

        const localAtt = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
        const localTodayPresent = localAtt.filter((r: any) => r.date === today && r.status === 'Present').length;
        setStaffPresent(Math.max(todayPresent, localTodayPresent));
      } catch (err) {
        console.error("Failed to fetch kpi data:", err);
      }
    };

    fetchCases();
    const interval = setInterval(fetchCases, 10000);
    window.addEventListener('storage', fetchCases);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchCases);
    };
  }, []);

  const cards = [
    {
      label: 'Total Applications',
      value: kpi.total,
      sub: `${kpi.active} Active Cases`,
      badgeText: 'Total Filed',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
      accentColor: '#2563eb',
      iconBg: '#dbeafe',
      iconColor: '#1e40af',
      Icon: Users,
      path: '/admin/applications?filter=all',
    },
    {
      label: 'Active Pipeline',
      value: kpi.active,
      sub: 'Currently in progress',
      badgeText: 'Under Process',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      accentColor: '#0d9488',
      iconBg: '#ccfbf1',
      iconColor: '#0f766e',
      Icon: FileText,
      path: '/admin/applications?filter=active',
    },
    {
      label: 'Pending Documents',
      value: kpi.docsPending,
      sub: kpi.docsPending === 0 ? 'All uploaded' : 'Action required',
      badgeText: kpi.docsPending > 0 ? 'Requires Action' : 'Cleared',
      badgeBg: kpi.docsPending > 0 ? '#fef3c7' : '#f1f5f9',
      badgeColor: kpi.docsPending > 0 ? '#b45309' : '#64748b',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      accentColor: '#f97316',
      iconBg: '#ffedd5',
      iconColor: '#c2410c',
      Icon: AlertTriangle,
      path: '/admin/applications?status=docs_pending',
    },
    {
      label: 'Government Review',
      value: kpi.govReview,
      sub: 'DTCP / Municipal Scrutiny',
      badgeText: 'Official Review',
      badgeBg: '#f5f3ff',
      badgeColor: '#6d28d9',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      accentColor: '#6366f1',
      iconBg: '#ede9fe',
      iconColor: '#6d28d9',
      Icon: Building,
      path: '/admin/applications?status=gov_review',
    },
    {
      label: 'Finally Approved',
      value: kpi.approved,
      sub: 'Sanction order issued',
      badgeText: 'Cleared',
      badgeBg: '#dcfce7',
      badgeColor: '#166534',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      accentColor: '#10b981',
      iconBg: '#dcfce7',
      iconColor: '#15803d',
      Icon: CheckCircle2,
      path: '/admin/applications?status=approved',
    },
    {
      label: 'Staff Present Today',
      value: staffPresent,
      sub: 'Attendance verified',
      badgeText: 'On Duty',
      badgeBg: '#ecfeff',
      badgeColor: '#0e7490',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
      accentColor: '#0284c7',
      iconBg: '#e0f2fe',
      iconColor: '#0369a1',
      Icon: UserCheck,
      path: '/admin/attendance',
    },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
      gap: '1.25rem', 
      marginBottom: '2rem' 
    }}>
      {cards.map(({ label, value, sub, badgeText, badgeBg, badgeColor, accentColor, iconBg, iconColor, Icon, path }) => (
        <div
          key={label}
          className="kpi-card-premium"
          onClick={() => navigate(path)}
          role="button"
          tabIndex={0}
          title={`Click to view ${label}`}
          style={{
            position: 'relative',
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.25rem 1.35rem',
            cursor: 'pointer',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Subtle top accent gradient bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: accentColor
          }} />

          {/* Card Top Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '0.75rem',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <Icon size={22} strokeWidth={1.8} />
            </div>

            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '2rem',
              backgroundColor: badgeBg,
              color: badgeColor,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.02em'
            }}>
              {badgeText}
            </span>
          </div>

          {/* Card Middle: Value & Label */}
          <div>
            <div style={{ 
              fontSize: '1.85rem', 
              fontWeight: 800, 
              color: '#0f172a', 
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '0.35rem'
            }}>
              {value}
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              fontWeight: 600, 
              color: '#475569',
              marginBottom: '0.4rem'
            }}>
              {label}
            </div>
          </div>

          {/* Card Bottom: Subtext */}
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#64748b', 
            fontWeight: 500,
            borderTop: '1px solid #f1f5f9',
            paddingTop: '0.5rem',
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{sub}</span>
            <span style={{ color: accentColor, fontWeight: 700, fontSize: '0.8rem' }}>→</span>
          </div>
        </div>
      ))}
      <style>{`
        .kpi-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 28px -6px rgba(15, 23, 42, 0.12), 0 8px 12px -4px rgba(15, 23, 42, 0.06) !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
};

export default KpiCards;
