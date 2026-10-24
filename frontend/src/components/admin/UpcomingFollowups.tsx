import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { followUps } from '../../data/mockData';

const UpcomingFollowups: React.FC = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/leads`);
        if (res.ok) {
          const data = await res.json();
          const items = data
            .slice(0, 5)
            .map((lead: any) => ({
              id: lead.id,
              name: lead.name || 'General Enquiry',
              task: lead.projectType || 'Customer Follow-up',
              contact: lead.phone || lead.email || '',
              date: lead.created_at 
                ? new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : 'Today',
              priority: lead.status === 'ACTIVE' ? 'High' : 'Medium'
            }));
          setEnquiries(items);
        } else if (followUps && followUps.length > 0) {
          setEnquiries(followUps.map((f: any) => ({
            id: f.app,
            name: f.app || 'Enquiry',
            task: f.type,
            contact: f.time,
            date: 'Today',
            priority: 'Medium'
          })));
        }
      } catch (err) {
        console.error("Failed to load upcoming enquiries:", err);
      }
    };

    fetchLeads();
  }, []);

  return (
    <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', minWidth: '350px' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={20} color="var(--primary-dark)" strokeWidth={1.5} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>Upcoming Enquiries</h3>
        </div>
        <button
          onClick={() => navigate('/admin/enquiries')}
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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer / Task</th>
              <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
              <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
              <th style={{ padding: '0.875rem 1rem', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length > 0 ? (
              enquiries.map((item, index) => (
                <tr 
                  key={index} 
                  onClick={() => navigate('/admin/enquiries')}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(237, 231, 218, 0.4)'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.date}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                    <div>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{item.task}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.contact || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '1rem', 
                      backgroundColor: item.priority === 'High' ? 'rgba(201, 106, 74, 0.1)' : 'rgba(214, 167, 86, 0.1)', 
                      color: item.priority === 'High' ? 'var(--accent)' : 'var(--warning)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {item.priority}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/admin/enquiries');
                      }}
                      title="Open Enquiries"
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%' }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No pending enquiries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingFollowups;
