import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { recentApplications } from '../../data/mockData';
import toast from 'react-hot-toast';

const FollowUpsList: React.FC = () => {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const isAdmin = localStorage.getItem('loggedInUser') === 'Admin';
  const loggedInUser = localStorage.getItem('loggedInUser') || 'Admin';

  const loadData = () => {
    const stored = localStorage.getItem('followUps');
    if (stored) {
      let data = JSON.parse(stored);
      if (!isAdmin) {
        data = data.filter((f: any) => f.assignedTo === loggedInUser);
      }
      setFollowUps(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [isAdmin, loggedInUser]);

  const updateStatus = (id: string, newStatus: string) => {
    const stored = localStorage.getItem('followUps');
    if (!stored) return;
    const data = JSON.parse(stored);
    const item = data.find((f: any) => f.id === id);
    if (item) {
      item.status = newStatus;
      if (newStatus === 'followup' && !item.assignedTo && isAdmin) {
        item.assignedTo = loggedInUser;
      }

      if (newStatus === 'converted') {
        const appsStored = localStorage.getItem('recentApplications');
        const apps = appsStored ? JSON.parse(appsStored) : recentApplications;
        
        const newId = `BA-2026-00${129 + apps.length}`;
        const newApp = {
          id: newId,
          customer: item.name,
          mobile: item.mobile,
          email: '',
          aadhar: '',
          location: item.location.charAt(0).toUpperCase() + item.location.slice(1),
          address: '',
          type: 'Residential',
          appType: 'Building Approval',
          staff: item.assignedTo || 'Unassigned',
          status: 'New',
          payment: 'Pending',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          surveyNo: '',
          plotArea: '',
          builtUpArea: '',
          floors: ''
        };
        
        apps.unshift(newApp);
        localStorage.setItem('recentApplications', JSON.stringify(apps));
        toast.success(`Successfully converted into application ${newId}! Remaining details can be completed via Edit.`);
      }

      localStorage.setItem('followUps', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div>


      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID & Date</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
              {isAdmin && <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assigned To</th>}
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {followUps.length > 0 ? followUps.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem' }}>{item.id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(item.timestamp).toLocaleString()}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {item.mobile} <MapPin size={12}/> {item.location}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    backgroundColor: item.status === 'converted' ? 'rgba(47, 125, 90, 0.1)' : item.status === 'rejected' ? 'rgba(185, 74, 72, 0.1)' : item.status === 'unassigned' ? '#fee2e2' : 'rgba(30, 58, 138, 0.05)', 
                    color: item.status === 'converted' ? 'var(--success-green)' : item.status === 'rejected' ? 'var(--error-red)' : item.status === 'unassigned' ? 'var(--error-red)' : 'var(--primary)',
                    textTransform: 'capitalize'
                  }}>
                    {item.status}
                  </span>
                </td>
                {isAdmin && (
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {item.assignedTo || '—'}
                  </td>
                )}
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {(item.status === 'unassigned' || item.status === 'followup') && (
                      <>
                        <button onClick={() => updateStatus(item.id, 'followup')} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MessageCircle size={14} /> Followup
                        </button>
                        <button onClick={() => updateStatus(item.id, 'converted')} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.25rem', backgroundColor: 'var(--success-green)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Converted
                        </button>
                        <button onClick={() => updateStatus(item.id, 'rejected')} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.25rem', backgroundColor: 'var(--error-red)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <XCircle size={14} /> Rejected
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No enquiries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FollowUpsList;
