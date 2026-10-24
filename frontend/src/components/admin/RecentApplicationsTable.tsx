import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getApplicationStatus } from '../../utils/statusHelper';

const RecentApplicationsTable: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/cases`);
        let mappedApps = [];
        
        if (res.ok) {
          const casesData = await res.json();
          mappedApps = casesData.map((c: any) => ({
            id: c.application_number || c.id,
            mongoId: c.id,
            customer: c.property?.owner_name || 'Unknown',
            type: c.property?.building_type || 'Residential',
            location: c.fullData?.propertyDetails?.city || c.property?.city || c.property?.jurisdiction || c.property?.village || '',
            status: getApplicationStatus(c.application_number || c.id, c.status, c),
            date: new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          }));
        }

        setApplications(mappedApps.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      }
    };
    
    fetchCases();
    window.addEventListener('storage', fetchCases);
    return () => window.removeEventListener('storage', fetchCases);
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status ? status.toUpperCase().replace(/\s+/g, '_') : '';
    if (s === 'GOV_VERIFICATION' || s === 'UNDER_REVIEW') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: 'rgba(23, 37, 84, 0.05)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>Under Review</span>;
    } else if (s === 'DOCUMENTS_VERIFICATION' || s === 'VERIFICATION') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: '#eff6ff', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>Documents Verification</span>;
    } else if (s === 'DOCUMENTS_PENDING' || s === 'PENDING_DOCUMENTS' || s === 'INTAKE' || s === 'NEW' || s === 'ACTION_REQUIRED' || s === 'ACTION_NEEDED' || s === 'DOCUMENT_COLLECTION') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: 'rgba(214, 167, 86, 0.1)', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600 }}>Documents Pending</span>;
    } else if (s === 'SITE_INSPECTION') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: 'rgba(201, 106, 74, 0.1)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>Site Inspection</span>;
    } else if (s === 'APPROVED' || s === 'COMPLETED') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: 'rgba(47, 125, 90, 0.1)', color: 'var(--success-green)', fontSize: '0.75rem', fontWeight: 600 }}>{status.replace(/_/g, ' ')}</span>;
    } else if (s === 'SUBMITTED') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '0.75rem', fontWeight: 600 }}>{status.replace(/_/g, ' ')}</span>;
    } else if (s === 'REJECTED') {
      return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 600 }}>{status.replace(/_/g, ' ')}</span>;
    }
    return <span style={{ padding: '0.35rem 0.85rem', borderRadius: '1rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{status ? status.replace(/_/g, ' ') : ''}</span>;
  };

  return (
    <div className="card" style={{ marginBottom: '2rem', flex: 1, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="var(--accent)" strokeWidth={2} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>Applications Requiring Attention</h3>
        </div>
        <button
          onClick={() => navigate('/admin/applications')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600, transition: 'color 0.2s' }}
        >
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application No</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Stage</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Updated</th>
              <th style={{ padding: '1rem 1.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, index) => (
              <tr
                key={index}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(237, 231, 218, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {app.id}
                </td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 600 }}>{app.customer}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.type} Building</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.location}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{getStatusBadge(app.status)}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.date}</td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/applications/${app.id}`);
                    }}
                    title="Open Application Details"
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ArrowRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentApplicationsTable;
