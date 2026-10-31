import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import EmployeeSidebar from '../components/employee/EmployeeSidebar';
import EmployeeTopbar from '../components/employee/EmployeeTopbar';

const EmployeeLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('employee_sidebar_collapsed') === 'true');
  const loggedInUser = localStorage.getItem('loggedInUser');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem('employee_sidebar_collapsed') === 'true');
    };
    window.addEventListener('employee_sidebar_toggle', handleToggle);
    return () => window.removeEventListener('employee_sidebar_toggle', handleToggle);
  }, []);

  if (!loggedInUser || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <EmployeeSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div 
        className={`layout-content ${isCollapsed ? 'sidebar-collapsed' : ''}`} 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      >
        <EmployeeTopbar 
          toggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
          isSidebarOpen={isSidebarOpen}
        />
        <main className="main-content-padding" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
    </div>
  );
};

export default EmployeeLayout;
