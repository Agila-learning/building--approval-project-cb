import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface EmployeeTopbarProps {
  toggleSidebar?: () => void;
}

const EmployeeTopbar: React.FC<EmployeeTopbarProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const [employeeName, setEmployeeName] = useState('Employee');

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (user && user !== 'Admin') setEmployeeName(user);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };
  
  // Create breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) : 'My Workspace';

  return (
    <header className="topbar-container">
      {/* Left side: Title & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {toggleSidebar && (
          <button 
            className="mobile-menu-btn"
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '0.4rem', cursor: 'pointer', borderRadius: '6px' }} 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            title="Open menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.1rem' }}>{currentPage}</h1>
          <div className="hidden-mobile-xs" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Workspace / {currentPage}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Search */}
        <div className="hidden-mobile" style={{ position: 'relative', width: '250px' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
            <Search size={16} />
          </div>
          <input 
            type="text" 
            placeholder="Search tasks, applications..." 
            style={{
              width: '100%',
              padding: '0.5rem 1rem 0.5rem 2.25rem',
              borderRadius: '2rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'var(--error-red)',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-surface)'
          }}>
            3
          </div>
        </div>

        {/* Profile Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>
            {getInitials(employeeName)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{employeeName}</div>
            <div className="hidden-mobile-xs" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Staff Member</div>
          </div>
          <ChevronDown size={16} color="var(--text-secondary)" />
        </div>

      </div>
    </header>
  );
};

export default EmployeeTopbar;
