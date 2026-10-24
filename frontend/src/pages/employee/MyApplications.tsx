import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Copy } from 'lucide-react';

const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('Employee');
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const loadData = () => {
    const user = localStorage.getItem('loggedInUser') || 'Employee';
    setEmployeeName(user);

    const storedApps = localStorage.getItem('recentApplications');
    if (storedApps) {
      const allApps = JSON.parse(storedApps);
      // Filter for applications assigned to this employee
      const assignedApps = allApps.filter((app: any) => app.assignedTo === user || app.assignedStaff === user || app.staff === user);
      setApplications(assignedApps);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const tabs = ['All', 'In Progress', 'Documents Pending', 'Verification', 'Approved'];

  const filteredApps = applications.filter(app => {
    if (activeTab !== 'All' && app.status !== activeTab) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return app.id.toLowerCase().includes(term) || 
             app.customer.toLowerCase().includes(term) || 
             app.location.toLowerCase().includes(term) ||
             (app.appType && app.appType.toLowerCase().includes(term));
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>My Applications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage and process applications assigned to you.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/employee/applications/new')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> New Application
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tabs & Search */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Search applications..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App ID & Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer & Location</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length > 0 ? filteredApps.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem', cursor: 'pointer' }} onClick={() => navigate(`/employee/applications/${app.id}`)}>
                        {app.id}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(app.id);
                          const btn = e.currentTarget;
                          btn.style.color = 'var(--success-green)';
                          setTimeout(() => btn.style.color = 'var(--text-secondary)', 2000);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem', display: 'flex', transition: 'color 0.2s' }}
                        title="Copy Application ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.date}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {app.customer}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.location}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--primary-dark)' }}>
                    {app.appType || 'Building'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      backgroundColor: app.status === 'Approved' ? 'rgba(47, 125, 90, 0.1)' : app.status === 'Documents Pending' ? 'rgba(185, 74, 72, 0.1)' : 'rgba(30, 58, 138, 0.05)', 
                      color: app.status === 'Approved' ? 'var(--success-green)' : app.status === 'Documents Pending' ? 'var(--error-red)' : 'var(--primary)' 
                    }}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }} onClick={() => navigate(`/employee/applications/${app.id}`)}>
                      Process
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No applications found matching your criteria.
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

export default MyApplications;
