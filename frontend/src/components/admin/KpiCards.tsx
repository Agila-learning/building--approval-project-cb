import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertTriangle, Building, CheckCircle2 } from 'lucide-react';
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
  const s = (status || '').toUpperCase();
  return ['APPROVED', 'COMPLETED'].includes(s);
};

const isRejected = (status: string) => {
  const s = (status || '').toUpperCase();
  return s === 'REJECTED';
};

const KpiCards: React.FC = () => {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState({ total: 0, active: 0, docsPending: 0, govReview: 0, approved: 0 });

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
          const status = getApplicationStatus(appNo, a.status);
          return { ...a, dynamicStatus: status };
        });

        const total = mappedApps.length;
        const active = mappedApps.filter((a: any) => !isApproved(a.dynamicStatus) && !isRejected(a.dynamicStatus) && !isApproved(a.status) && !isRejected(a.status)).length;
        const docsPending = mappedApps.filter((a: any) => isDocsPending(a.dynamicStatus) || isDocsPending(a.status)).length;
        const govReview = mappedApps.filter((a: any) => isGovReview(a.dynamicStatus) || isGovReview(a.status)).length;
        const approved = mappedApps.filter((a: any) => isApproved(a.dynamicStatus) || isApproved(a.status)).length;

        setKpi({ total, active, docsPending, govReview, approved });
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
      sub: kpi.total === 0 ? 'No applications yet' : `${kpi.active} active`,
      iconBg: 'rgba(30, 58, 138, 0.05)',
      iconColor: 'var(--primary-dark)',
      subColor: 'var(--success-green)',
      Icon: Users,
      path: '/admin/applications?filter=all',
    },
    {
      label: 'Active Applications',
      value: kpi.active,
      sub: kpi.active === 0 ? 'None active' : `${kpi.active} in progress`,
      iconBg: 'rgba(201, 106, 74, 0.1)',
      iconColor: 'var(--accent)',
      subColor: 'var(--accent)',
      Icon: FileText,
      path: '/admin/applications?filter=active',
    },
    {
      label: 'Pending Documents',
      value: kpi.docsPending,
      sub: kpi.docsPending === 0 ? 'All clear' : 'Waiting for upload',
      iconBg: 'rgba(214, 167, 86, 0.1)',
      iconColor: 'var(--warning)',
      subColor: 'var(--text-secondary)',
      Icon: AlertTriangle,
      path: '/admin/applications?status=docs_pending',
    },
    {
      label: 'Government Review',
      value: kpi.govReview,
      sub: kpi.govReview === 0 ? 'None submitted' : 'Processing',
      iconBg: 'rgba(23, 37, 84, 0.05)',
      iconColor: 'var(--primary)',
      subColor: 'var(--text-secondary)',
      Icon: Building,
      path: '/admin/applications?status=gov_review',
    },
    {
      label: 'Approved',
      value: kpi.approved,
      sub: kpi.approved === 0 ? 'None this month' : 'Completed',
      iconBg: 'rgba(67, 104, 80, 0.1)',
      iconColor: 'var(--success-green)',
      subColor: 'var(--success-green)',
      Icon: CheckCircle2,
      path: '/admin/applications?status=approved',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {cards.map(({ label, value, sub, iconBg, iconColor, subColor, Icon, path }) => (
        <div
          key={label}
          className="card kpi-card"
          onClick={() => navigate(path)}
          role="button"
          tabIndex={0}
          title={`Filter by ${label}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: subColor, fontWeight: 500, marginTop: '0.2rem' }}>{sub}</div>
          </div>
        </div>
      ))}
      <style>{`
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(23, 37, 84, 0.12);
        }
      `}</style>
    </div>
  );
};

export default KpiCards;
