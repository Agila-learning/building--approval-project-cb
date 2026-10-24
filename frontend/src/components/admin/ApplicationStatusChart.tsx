import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getApplicationStatus } from '../../utils/statusHelper';

const STATUS_COLORS: Record<string, string> = {
  'New':                  '#0369a1',
  'Documents Pending':    'var(--warning-gold)',
  'DOCUMENTS_PENDING':    'var(--warning-gold)',
  'Documents Verification': 'var(--primary)',
  'DOCUMENTS_VERIFICATION': 'var(--primary)',
  'DOCUMENT_COLLECTION':  'var(--warning-gold)',
  'Action Required':      'var(--warning-gold)',
  'Verification':         'var(--primary-dark)',
  'Under Review':         'var(--primary)',
  'Submitted':            '#7e22ce',
  'SUBMITTED':            '#7e22ce',
  'Gov Verification':     '#3D5A80',
  'Site Inspection':      'var(--accent)',
  'Approved':             'var(--success-green)',
  'COMPLETED':            'var(--success-green)',
  'Rejected':             'var(--error-red)',
};

const ApplicationStatusChart: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<{name: string, value: number, color: string}[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/cases`);
        let apps: any[] = [];
        if (res.ok) {
          apps = await res.json();
        }

        const buckets: Record<string, number> = {};
        apps.forEach(app => {
          let status = getApplicationStatus(app.application_number || app.id, app.status, app);
          
          // Map backend specific statuses to chart friendly names if getApplicationStatus doesn't
          if (status === 'INTAKE') status = 'Documents Pending';
          if (status === 'DOCUMENTS_PENDING') status = 'Documents Pending';
          if (status === 'DOCUMENTS_VERIFICATION') status = 'Documents Verification';
          if (status === 'COMPLETED') status = 'Approved';
          if (status === 'DOCUMENT_COLLECTION') status = 'Documents Pending';

          buckets[status] = (buckets[status] || 0) + 1;
        });

        const chartData = Object.entries(buckets)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || 'var(--text-muted)' }));

        setData(chartData);
      } catch (err) {
        console.error("Failed to fetch cases for chart:", err);
      }
    };

    fetchCases();
    window.addEventListener('storage', fetchCases);
    return () => window.removeEventListener('storage', fetchCases);
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Fallback for empty state (pie needs at least one non-zero value to render)
  const chartData = data.length > 0 ? data : [{ name: 'No Data', value: 1, color: 'var(--bg-secondary)' }];

  const handleStatusClick = (statusName: string) => {
    if (!statusName || statusName === 'No Data') return;
    navigate(`/admin/applications?status=${encodeURIComponent(statusName)}`);
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>Application Status Overview</h3>
        <button
          onClick={() => navigate('/admin/applications?filter=all')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          View All
        </button>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', flex: 1 }}>
        {/* Chart */}
        <div style={{ flex: '1 1 200px', height: '250px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="var(--bg-surface)"
                strokeWidth={2}
                cursor="pointer"
                onClick={(entry: any) => {
                  if (entry && entry.name) {
                    handleStatusClick(entry.name);
                  }
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-surface)', fontFamily: 'var(--font-family)' }}
                itemStyle={{ color: 'var(--primary-dark)', fontWeight: 600 }}
                formatter={(value: any, name: string) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Inner Text (Clickable to view all) */}
          <div 
            onClick={() => navigate('/admin/applications?filter=all')}
            role="button"
            tabIndex={0}
            title="Click to view all applications"
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>{total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: '1 1 200px', display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {data.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
              No applications yet
            </div>
          ) : (
            data.map((item, index) => (
              <div 
                key={index} 
                onClick={() => handleStatusClick(item.name)}
                role="button"
                tabIndex={0}
                title={`Click to filter applications by ${item.name}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.transform = 'translateX(3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }}></div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--primary-dark)', padding: '0.1rem 0.5rem', borderRadius: '1rem', backgroundColor: 'var(--bg-secondary)', fontSize: '0.8125rem' }}>
                  {item.value}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatusChart;
