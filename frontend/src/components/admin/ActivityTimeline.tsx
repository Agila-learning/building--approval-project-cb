import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, FileText, CheckCircle, CreditCard, Play } from 'lucide-react';
import { recentActivity } from '../../data/mockData';
import { getApiUrl } from '../../config/api';

const ActivityTimeline: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>(recentActivity);

  useEffect(() => {
    const fetchRecentCases = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/cases`);
        if (res.ok) {
          const cases = await res.json();
          if (cases.length > 0) {
            const mapped = cases.slice(0, 5).map((c: any) => {
              const status = c.status || 'Created';
              let type = 'document';
              if (['Approved', 'COMPLETED'].includes(status)) type = 'success';
              else if (['SUBMITTED', 'Submitted'].includes(status)) type = 'status';
              
              const appNo = c.application_number || c.id;
              const customer = c.property?.owner_name || 'Customer';
              const dateStr = c.created_at 
                ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : 'Recent';

              return {
                id: appNo,
                title: `${customer} (${appNo})`,
                desc: `Application status: ${status}`,
                time: dateStr,
                type: type
              };
            });
            setActivities(mapped);
          }
        }
      } catch (e) {
        console.error('Error fetching activities:', e);
      }
    };

    fetchRecentCases();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText size={16} color="var(--accent)" strokeWidth={1.5} />;
      case 'status': return <Play size={16} color="var(--warning)" fill="var(--warning)" strokeWidth={1.5} />;
      case 'payment': return <CreditCard size={16} color="var(--primary)" strokeWidth={1.5} />;
      case 'success': return <CheckCircle size={16} color="var(--success-green)" strokeWidth={1.5} />;
      default: return <Activity size={16} color="var(--text-secondary)" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'document': return 'rgba(201, 106, 74, 0.1)';
      case 'status': return 'rgba(214, 167, 86, 0.1)';
      case 'payment': return 'rgba(23, 37, 84, 0.05)';
      case 'success': return 'rgba(47, 125, 90, 0.1)';
      default: return 'var(--bg-secondary)';
    }
  };

  return (
    <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', minWidth: '350px' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={20} color="var(--primary-dark)" strokeWidth={1.5} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>Recent Activities</h3>
        </div>
        <button
          onClick={() => navigate('/admin/applications')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: 'var(--accent)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.2s'
          }}
        >
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div 
              key={index} 
              onClick={() => activity.id ? navigate(`/admin/applications/${activity.id}`) : navigate('/admin/applications')}
              role="button"
              tabIndex={0}
              style={{ 
                display: 'flex', 
                gap: '1rem', 
                position: 'relative', 
                paddingBottom: index === activities.length - 1 ? 0 : '1.5rem',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(237, 231, 218, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Vertical Line */}
              {index < activities.length - 1 && (
                <div style={{ position: 'absolute', top: '36px', bottom: 0, left: '21px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
              )}
              
              <div style={{ zIndex: 1, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: getBgColor(activity.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getIcon(activity.type)}
              </div>
              
              <div style={{ flex: 1, marginTop: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{activity.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activity.time}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{activity.desc}</p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
