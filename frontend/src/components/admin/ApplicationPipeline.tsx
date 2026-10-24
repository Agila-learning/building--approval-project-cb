import React, { useState, useEffect } from 'react';
import { FilePlus, FileText, CheckCircle, Send, Eye, Stamp } from 'lucide-react';
import { getApplicationStatus } from '../../utils/statusHelper';

const getPipelineCounts = () => {
  const stored = localStorage.getItem('recentApplications');
  const apps: any[] = stored ? JSON.parse(stored) : [];

  const counts = { New: 0, Documents: 0, Verification: 0, Submitted: 0, Inspection: 0, Approval: 0 };

  apps.forEach(app => {
    const status = getApplicationStatus(app.id, app.status);
    if (status === 'New') counts.New++;
    else if (['Documents Pending', 'Action Required'].includes(status)) counts.Documents++;
    else if (['Verification', 'Under Review'].includes(status)) counts.Verification++;
    else if (['Submitted', 'Gov Verification'].includes(status)) counts.Submitted++;
    else if (status === 'Site Inspection') counts.Inspection++;
    else if (status === 'Approved') counts.Approval++;
  });

  return counts;
};

const ApplicationPipeline: React.FC = () => {
  const [counts, setCounts] = useState(getPipelineCounts());

  useEffect(() => {
    const update = () => setCounts(getPipelineCounts());
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  const pipelineStages = [
    { name: 'New',          count: counts.New,          icon: <FilePlus size={24} strokeWidth={1.5} />,   color: 'var(--text-secondary)',                bgColor: 'var(--bg-secondary)' },
    { name: 'Documents',    count: counts.Documents,    icon: <FileText size={24} strokeWidth={1.5} />,   color: 'var(--warning)',                bgColor: 'rgba(214, 167, 86, 0.1)' },
    { name: 'Verification', count: counts.Verification, icon: <CheckCircle size={24} strokeWidth={1.5} />,color: 'var(--primary)',                bgColor: 'rgba(23, 37, 84, 0.05)' },
    { name: 'Submitted',    count: counts.Submitted,    icon: <Send size={24} strokeWidth={1.5} />,        color: 'var(--primary-dark)',                bgColor: 'rgba(30, 58, 138, 0.05)' },
    { name: 'Inspection',   count: counts.Inspection,   icon: <Eye size={24} strokeWidth={1.5} />,         color: 'var(--accent)',                bgColor: 'rgba(201, 106, 74, 0.1)' },
    { name: 'Approval',     count: counts.Approval,     icon: <Stamp size={24} strokeWidth={1.5} />,       color: 'var(--success-green)',   bgColor: 'rgba(47, 125, 90, 0.1)' },
  ];

  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>Application Pipeline</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current stage distribution of all active applications.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {pipelineStages.map((stage, index) => (
          <React.Fragment key={index}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px', transition: 'transform 0.2s', cursor: 'default' }} className="pipeline-item">
              <div style={{ 
                width: '48px', height: '48px', borderRadius: 'var(--border-radius-lg)', 
                backgroundColor: stage.bgColor, color: stage.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem',
                boxShadow: stage.count > 0 ? `0 4px 12px ${stage.color}20` : 'none',
                transition: 'box-shadow 0.3s, transform 0.2s',
              }} className="pipeline-icon">
                {React.cloneElement(stage.icon as any, { size: 20 })}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>{stage.name}</div>
              <div style={{ 
                fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)',
                color: stage.count > 0 ? stage.color : 'var(--text-secondary)' 
              }}>{stage.count}</div>
            </div>
            
            {index < pipelineStages.length - 1 && (
              <div style={{ flex: 1, minWidth: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border-color)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <style>{`
        .pipeline-item:hover .pipeline-icon {
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
};

export default ApplicationPipeline;
