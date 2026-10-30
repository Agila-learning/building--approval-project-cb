import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Menu, CheckCircle2, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../config/api';

interface EmployeeTopbarProps {
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  case_id?: string;
  created_at?: string;
}

const EmployeeTopbar: React.FC<EmployeeTopbarProps> = ({ toggleSidebar, isSidebarOpen = true }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('Employee');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (user && user !== 'Admin') setEmployeeName(user);
  }, []);

  const fetchLiveNotifications = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/notifications`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch live notifications from API:", e);
    }

    // LocalStorage fallback
    const stored = localStorage.getItem('mock_notifications');
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 3000);
    window.addEventListener('storage', fetchLiveNotifications);
    window.addEventListener('focus', fetchLiveNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLiveNotifications);
      window.removeEventListener('focus', fetchLiveNotifications);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await fetch(`${getApiUrl()}/notifications/mark-all-read`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('mock_notifications', JSON.stringify(updated));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };
  
  // Create breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 1 ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) : 'My Workspace';

  return (
    <header className="topbar-container" style={{ position: 'relative', zIndex: 100 }}>
      {/* Left side: Title & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {toggleSidebar && (
          <button 
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            title={isSidebarOpen ? "Close sidebar for Full Screen" : "Open menu"}
          >
            <Menu size={18} />
            <span className="hidden-mobile-xs" style={{ fontSize: '0.75rem' }}>
              {isSidebarOpen ? "Full Screen" : "Menu"}
            </span>
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
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        
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
              padding: '0.45rem 1rem 0.45rem 2.25rem',
              borderRadius: '2rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.825rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Real-time Notifications Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              backgroundColor: showNotifications ? '#f1f5f9' : '#ffffff',
              position: 'relative',
              padding: 0,
              transition: 'background-color 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Bell size={18} strokeWidth={2} color="#1e293b" />
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '-3px', 
                right: '-3px', 
                minWidth: '18px', 
                height: '18px', 
                padding: '0 4px',
                borderRadius: '999px', 
                backgroundColor: '#ea580c', 
                border: '2px solid #ffffff', 
                color: '#ffffff', 
                fontSize: '10px', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(234,88,12,0.4)',
                lineHeight: 1
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              backgroundColor: '#fff',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              zIndex: 1000
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#ea580c', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontWeight: 700 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={async () => {
                        if (!notif.read) {
                          try {
                            await fetch(`${getApiUrl()}/notifications/${notif.id}/read`, { method: 'PATCH' });
                          } catch (e) {}
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        }
                        if (notif.case_id) {
                          navigate(`/employee/tasks`);
                          setShowNotifications(false);
                        }
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: notif.read ? '#fff' : '#f8fafc',
                        cursor: notif.case_id ? 'pointer' : 'default',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? '#fff' : '#f8fafc'}
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: notif.read ? 'transparent' : '#ea580c',
                        marginTop: '0.4rem',
                        flexShrink: 0
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: notif.read ? 600 : 700, color: 'var(--primary-dark)', marginBottom: '0.15rem' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.25rem' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={10} />
                          {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div 
          onClick={() => navigate('/employee/profile')}
          title="View & Edit Profile"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
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
