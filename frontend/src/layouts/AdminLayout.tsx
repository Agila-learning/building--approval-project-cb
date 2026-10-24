import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const loggedInUser = localStorage.getItem('loggedInUser');

  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="layout-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
