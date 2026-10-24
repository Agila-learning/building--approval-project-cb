import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Home, ClipboardList, CheckCircle, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface AdminTopbarProps {
  toggleSidebar?: () => void;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ toggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = () => {
      const stored = localStorage.getItem('mock_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        const initial = [
          { id: 1, title: 'New Application', message: 'Ramesh Kumar submitted a new application.', time: '10 mins ago', read: false },
          { id: 2, title: 'Document Uploaded', message: 'Bala Krishnan uploaded requested documents.', time: '1 hour ago', read: false },
          { id: 3, title: 'Payment Received', message: '₹25,000 received for APP-260926-001.', time: '2 hours ago', read: true }
        ];
        setNotifications(initial);
        localStorage.setItem('mock_notifications', JSON.stringify(initial));
      }
    };
    
    loadNotifications();
    window.addEventListener('storage', loadNotifications);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', loadNotifications);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('mock_notifications', JSON.stringify(updated));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header Bar */}
      <header className="topbar-container" style={{ 
        backgroundColor: '#fff', 
        borderBottom: '1px solid var(--border-color)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        height: '48px',
        position: 'relative',
        zIndex: 100
      }}>
        
        {/* Left side: Hamburger button for mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {toggleSidebar && (
            <button 
              className="mobile-menu-btn"
              onClick={toggleSidebar}
              aria-label="Toggle navigation menu"
              title="Open menu"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.4rem',
                cursor: 'pointer',
                borderRadius: '6px',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu size={22} />
            </button>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Search */}
          <div className="hidden-mobile" style={{ position: 'relative', width: '250px' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={14} />
            </div>
            <input 
              type="text" 
              placeholder="Search applications, customers..." 
              style={{
                width: '100%', padding: '0.35rem 1rem 0.35rem 1.8rem', borderRadius: '2rem',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.8rem', outline: 'none', color: 'var(--text-primary)', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Quick Actions & Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
            <NavLink to="/admin" style={({isActive}) => ({ color: isActive ? 'var(--primary)' : 'inherit', display: 'flex', alignItems: 'center' })} title="Home">
              <Home size={18} strokeWidth={1.5} />
            </NavLink>
            <NavLink to="/admin/reports" style={({isActive}) => ({ color: isActive ? 'var(--primary)' : 'inherit', display: 'flex', alignItems: 'center' })} title="Reports Tray">
              <ClipboardList size={18} strokeWidth={1.5} />
            </NavLink>
            
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <div 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} strokeWidth={1.5} color={showNotifications ? 'var(--primary)' : 'inherit'} />
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--accent)', border: '1.5px solid #fff', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount}
                  </div>
                )}
              </div>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div style={{ position: 'absolute', top: '100%', right: '-10px', marginTop: '15px', width: '320px', backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)', overflow: 'hidden', zIndex: 1000 }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: notif.read ? '#fff' : '#f0f9ff', transition: 'background-color 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: notif.read ? 'var(--text-primary)' : 'var(--primary-dark)' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{notif.time}</div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.message}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>

          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'var(--font-heading)' }}>
              AD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>Admin User</div>
              <div className="hidden-mobile-xs" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Administrator</div>
            </div>
            <ChevronDown size={14} color="var(--text-secondary)" />
          </div>
        </div>
      </header>
    </div>
  );
};

export default AdminTopbar;
