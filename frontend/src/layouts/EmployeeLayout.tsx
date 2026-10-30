import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import EmployeeSidebar from '../components/employee/EmployeeSidebar';
import EmployeeTopbar from '../components/employee/EmployeeTopbar';

const EmployeeLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('employee_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });
  const loggedInUser = localStorage.getItem('loggedInUser');

  const handleToggle = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('employee_sidebar_open', String(next));
      return next;
    });
  };

  const handleSetOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    localStorage.setItem('employee_sidebar_open', String(open));
  };

  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-wrapper">
      <EmployeeSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={handleSetOpen}
      />
      <div 
        className={`layout-content ${!isSidebarOpen ? 'full-screen' : ''}`} 
        style={{ transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
          <EmployeeTopbar 
            toggleSidebar={handleToggle} 
            isSidebarOpen={isSidebarOpen}
          />
          <main className="main-content-padding" style={{ flex: 1, padding: '2rem' }}>
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay open" 
          onClick={() => handleSetOpen(false)}
        />
      )}
    </div>
  );
};

export default EmployeeLayout;
