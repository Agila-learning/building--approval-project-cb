import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout: React.FC = () => {
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
    <div className="layout-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className={`layout-content ${isCollapsed ? 'sidebar-collapsed' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'margin-left 0.3s ease' }}>
        <AdminTopbar toggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
        <main className="main-content-padding" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
    </div>
  );
};

export default AdminLayout;
