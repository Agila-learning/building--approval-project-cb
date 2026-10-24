import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import EmployeeSidebar from '../components/employee/EmployeeSidebar';
import EmployeeTopbar from '../components/employee/EmployeeTopbar';

const EmployeeLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const loggedInUser = localStorage.getItem('loggedInUser');

  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-wrapper">
      <EmployeeSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="layout-content">
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
