import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, 
  PhoneCall, 
  User, LogOut, Building, CalendarClock,
  X, ChevronLeft, ChevronRight
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/employee' },
  { title: 'My Applications', icon: <FileText size={20} />, path: '/employee/applications' },
  { title: 'Attendance', icon: <CalendarClock size={20} />, path: '/employee/attendance' },
  { title: 'Enquiries', icon: <PhoneCall size={20} />, path: '/employee/followups' },
  { title: 'Profile', icon: <User size={20} />, path: '/employee/profile' },
];

interface EmployeeSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ isOpen, setIsOpen, isCollapsed: propCollapsed, setIsCollapsed: propSetCollapsed }) => {
  const [employeeName, setEmployeeName] = useState('Employee');
  const [internalCollapsed, setInternalCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const isCollapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    if (propSetCollapsed) propSetCollapsed(nextVal);
    setInternalCollapsed(nextVal);
    localStorage.setItem('sidebar_collapsed', nextVal.toString());
    window.dispatchEvent(new Event('sidebar_toggle'));
  };

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (user && user !== 'Admin') setEmployeeName(user);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <aside className={`employee-sidebar sidebar-container ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`} style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo Area */}
      <div style={{ padding: '1.25rem 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building color="var(--primary)" size={28} />
          <div className="sidebar-logo-text">
            <div style={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.05em' }}>BUILD APPROVAL ERP</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Employee Portal</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            className="desktop-collapse-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar (250px)" : "Collapse sidebar (70px)"}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--bg-surface)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {setIsOpen && (
            <button
              className="mobile-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              title="Close menu"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--bg-surface)',
                cursor: 'pointer',
                padding: '6px',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: 0, margin: 0 }}>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink 
                to={item.path} 
                end={item.path === '/employee'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? 'var(--bg-surface)' : '#cbd5e1',
                  backgroundColor: isActive ? 'rgba(11, 99, 206, 0.2)' : 'transparent',
                  borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                })}
                onClick={() => setIsOpen && setIsOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ color: isActive ? 'var(--primary)' : '#94a3b8', minWidth: '24px', display: 'flex', justifyContent: 'center' }}>
                      {item.icon}
                    </span>
                    <span className="sidebar-text">{item.title}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile Area */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
          {getInitials(employeeName)}
        </div>
        <div className="sidebar-profile-info" style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{employeeName}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success-green)' }}></div>
            Staff Member
          </div>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('loggedInUser'); localStorage.removeItem('token'); window.location.href = '/login'; }}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          title="Logout"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-red)'; e.currentTarget.style.backgroundColor = 'rgba(185, 74, 72, 0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <LogOut size={18} />
        </button>
      </div>
      
      {/* Custom Scrollbar Styles for the sidebar */}
      <style>{`
        .employee-sidebar nav::-webkit-scrollbar {
          width: 4px;
        }
        .employee-sidebar nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .employee-sidebar nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .employee-sidebar nav:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </aside>
  );
};

export default EmployeeSidebar;
