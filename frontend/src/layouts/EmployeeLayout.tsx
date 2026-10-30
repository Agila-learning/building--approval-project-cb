import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import EmployeeSidebar from '../components/employee/EmployeeSidebar';
import EmployeeTopbar from '../components/employee/EmployeeTopbar';

const EmployeeLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const loggedInUser = localStorage.getItem('loggedInUser');

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };
    window.addEventListener('sidebar_toggle', handleToggle);
    return () => window.removeEventListener('sidebar_toggle', handleToggle);
  }, []);

  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-wrapper">
      <EmployeeSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className={`layout-content ${isCollapsed ? 'sidebar-collapsed' : ''}`} style={{ transition: 'margin-left 0.3s ease' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
          <EmployeeTopbar toggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
          <main className="main-content-padding" style={{ flex: 1, padding: '2rem' }}>
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>
    </div>
  );
};

export default EmployeeLayout;
