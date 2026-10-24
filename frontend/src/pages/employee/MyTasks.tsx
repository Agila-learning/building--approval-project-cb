import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { getEmployeeTasks } from '../../utils/employeeUtils';
import type { Task } from '../../utils/employeeUtils';

const MyTasks: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const employeeName = 'Naveen'; // Hardcoded for demo

  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('filter') || 'All';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState(
    initialFilter === 'progress' ? 'In Progress' 
    : initialFilter === 'completed' ? 'Completed' 
    : 'All'
  );
  
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    setTasks(getEmployeeTasks(employeeName));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const tabs = ['All', 'Pending Review', 'In Progress', 'Completed'];

  const filteredTasks = tasks.filter(task => {
    // Tab filter
    if (activeTab !== 'All' && task.status !== activeTab) return false;
    
    // URL filter if 'assigned'
    if (initialFilter === 'assigned' && task.status === 'Completed' && activeTab === 'All') return false;

    // Due today logic (simple)
    if (initialFilter === 'duetoday' && activeTab === 'All' && task.status === 'Completed') return false; 
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return task.id.toLowerCase().includes(term) || 
             task.title.toLowerCase().includes(term) || 
             task.customerName.toLowerCase().includes(term) ||
             task.applicationId.toLowerCase().includes(term);
    }

    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>My Tasks</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your assigned tasks and daily workflow.</p>
        </div>
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
                placeholder="Search tasks..." 
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
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Task Details</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Application & Customer</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Priority & Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>Due Date <ArrowUpDown size={12} /></div>
                </th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? filteredTasks.map(task => (
                <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{task.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.id}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginBottom: '0.25rem' }} onClick={() => navigate(`/employee/tasks/${task.id}`)}>
                      {task.applicationId}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.customerName} - {task.propertyLocation}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {task.status}
                      </span>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: task.priority === 'Urgent' || task.priority === 'High' ? 'rgba(185, 74, 72, 0.1)' : 'rgba(30, 58, 138, 0.05)', color: task.priority === 'Urgent' || task.priority === 'High' ? 'var(--error-red)' : 'var(--primary)' }}>
                        {task.priority}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {task.dueDate}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }} onClick={() => navigate(`/employee/tasks/${task.id}`)}>
                      Open Task
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No tasks found matching your criteria.
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

export default MyTasks;
