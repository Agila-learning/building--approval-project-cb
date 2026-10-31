import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, 
  PhoneCall, CreditCard,
  User, LogOut, Building, CalendarClock,
  X, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} />, path: '/employee' },
  { title: 'My Applications', icon: <FileText size={20} strokeWidth={1.5} />, path: '/employee/applications' },
  { title: 'Documents', icon: <ClipboardList size={20} strokeWidth={1.5} />, path: '/employee/documents' },
  { title: 'Payments', icon: <CreditCard size={20} strokeWidth={1.5} />, path: '/employee/payments' },
  { title: 'Attendance', icon: <CalendarClock size={20} strokeWidth={1.5} />, path: '/employee/attendance' },
  { title: 'Enquiries', icon: <PhoneCall size={20} strokeWidth={1.5} />, path: '/employee/followups' },
  { title: 'Profile', icon: <User size={20} strokeWidth={1.5} />, path: '/employee/profile' },
];

interface EmployeeSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ 
  isOpen = false, 
  setIsOpen,
  isCollapsed: propCollapsed,
  setIsCollapsed: propSetCollapsed
}) => {
  const [employeeName, setEmployeeName] = useState('Staff Member');
  const [internalCollapsed, setInternalCollapsed] = useState(() => localStorage.getItem('employee_sidebar_collapsed') === 'true');
  const navigate = useNavigate();

  const isCollapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    if (propSetCollapsed) propSetCollapsed(nextVal);
    setInternalCollapsed(nextVal);
    localStorage.setItem('employee_sidebar_collapsed', nextVal.toString());
  };

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (user && user !== 'Admin') setEmployeeName(user);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('staffId');
    navigate('/login');
  };

  return (
    <aside className={`employee-sidebar sidebar-container ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`} style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Logo Area */}
      <div style={{ 
        padding: isCollapsed ? '1rem 0' : '1.25rem 15px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        flexShrink: 0, 
        display: 'flex', 
        flexDirection: isCollapsed ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: isCollapsed ? '0.75rem' : '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px', display: 'flex', flexShrink: 0 }}>
            <Building color="var(--primary)" size={24} />
          </div>
          <div className="sidebar-logo-text">
            <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em', color: '#fff', lineHeight: 1.1 }}>CB APPROVALS</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Portal</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Desktop Collapse / Minimise Toggle */}
          <button
            className="desktop-collapse-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Maximise sidebar (250px)" : "Minimise sidebar (70px)"}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: 'var(--bg-surface)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Drawer Close */}
          {setIsOpen && (
            <button
              className="mobile-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              title="Close menu"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '6px',
                color: 'var(--bg-surface)',
                cursor: 'pointer',
                padding: '6px',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto', overflowX: 'hidden' }}>
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
                  padding: '0.75rem 15px',
                  color: isActive ? 'var(--bg-surface)' : 'rgba(255,255,255,0.65)',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                })}
                onClick={() => {
                  if (window.innerWidth <= 1024 && setIsOpen) setIsOpen(false);
                }}
                title={item.title}
              >
                <span style={{ minWidth: '40px', display: 'flex', justifyContent: 'center' }}>
                  {item.icon}
                </span>
                <span className="sidebar-text" style={{ whiteSpace: 'nowrap' }}>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile & Logout Footer */}
      <div style={{ padding: '1rem 15px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: 'var(--accent)', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, fontSize: '0.8125rem' 
            }}>
              {getInitials(employeeName)}
            </div>
            <div className="sidebar-profile-info">
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bg-surface)', whiteSpace: 'nowrap', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {employeeName}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Staff Officer</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'none', border: 'none', color: '#ef4444', 
              cursor: 'pointer', padding: '6px', borderRadius: '4px',
              display: isCollapsed ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default EmployeeSidebar;
