import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Home, ClipboardList, CheckCircle, Menu, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../config/api';

interface Notification {
  id: string | number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  case_id?: string;
  created_at?: string;
}

function getRelativeTime(timestamp?: string | number): string {
  if (!timestamp) return 'Just now';
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(time)) return 'Just now';
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

interface AdminTopbarProps {
  toggleSidebar?: () => void;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userName, setUserName] = useState('Admin User');
  const [userRole, setUserRole] = useState('Administrator');
  const profileRef = useRef<HTMLDivElement>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (q) {
      navigate(`/admin/applications?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/admin/applications');
    }
  };

  const loadProfile = () => {
    const pic = localStorage.getItem('profilePicture') || localStorage.getItem('adminProfilePic') || null;
    setProfilePic(pic);
    const user = localStorage.getItem('loggedInUser');
    if (user) setUserName(user);
    const role = localStorage.getItem('userRole');
    if (role) setUserRole(role.toUpperCase() === 'ADMIN' ? 'Administrator' : role);
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/notifications`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: getRelativeTime(n.created_at),
            read: n.read || false,
            case_id: n.case_id,
            created_at: n.created_at
          })));
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch backend notifications:", err);
    }

    // Fallback if network offline
    const stored = localStorage.getItem('mock_notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadNotifications();
    loadProfile();
    const interval = setInterval(loadNotifications, 3000); // 3s real-time polling
    window.addEventListener('storage', loadNotifications);
    window.addEventListener('storage', loadProfile);
    window.addEventListener('focus', loadNotifications);
    window.addEventListener('focus', loadProfile);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadNotifications);
      window.removeEventListener('storage', loadProfile);
      window.removeEventListener('focus', loadNotifications);
      window.removeEventListener('focus', loadProfile);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
        
        {/* Left side: Hamburger button for mobile & desktop toggle */}
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

          <button
            className="desktop-sidebar-toggle-btn"
            onClick={() => {
              const isColl = localStorage.getItem('sidebar_collapsed') === 'true';
              localStorage.setItem('sidebar_collapsed', (!isColl).toString());
              window.dispatchEvent(new Event('sidebar_toggle'));
            }}
            aria-label="Toggle sidebar width"
            title="Toggle sidebar (Minimise / Maximise)"
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Right side: Actions */}
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Search Form */}
          <form 
            onSubmit={handleGlobalSearch} 
            className="hidden-mobile" 
            style={{ position: 'relative', width: '270px' }}
          >
            <button
              type="submit"
              title="Search applications & customers"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '3px'
              }}
            >
              <Search size={15} />
            </button>
            <input 
              type="text" 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search applications, customers..." 
              style={{
                width: '100%',
                padding: '0.4rem 2.2rem 0.4rem 2rem',
                borderRadius: '2rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.8125rem',
                outline: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 138, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.backgroundColor = 'var(--bg-secondary)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
              }}
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearch('');
                  navigate('/admin/applications');
                }}
                title="Clear Search"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '50%'
                }}
              >
                ✕
              </button>
            )}
          </form>

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
                  top: '100%', 
                  right: 0, 
                  marginTop: '12px', 
                  width: 'min(360px, calc(100vw - 24px))', 
                  backgroundColor: '#fff', 
                  borderRadius: '0.75rem', 
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                  border: '1px solid var(--border-color)', 
                  overflow: 'hidden', 
                  zIndex: 1100 
                }}>
                  <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Notifications</h3>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#ea580c', color: 'white', padding: '0.1rem 0.45rem', borderRadius: '1rem', fontWeight: 700 }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={async () => {
                            if (!notif.read) {
                              try {
                                await fetch(`${getApiUrl()}/notifications/${notif.id}/read`, { method: 'PATCH' });
                              } catch (e) {}
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }
                            setShowNotifications(false);
                            if (notif.case_id) {
                              navigate(`/admin/applications/${notif.case_id}/view`);
                            } else {
                              navigate('/admin/applications');
                            }
                          }}
                          style={{ 
                            padding: '0.85rem 1rem', 
                            borderBottom: '1px solid var(--border-color)', 
                            backgroundColor: notif.read ? '#fff' : '#f0f9ff', 
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease' 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? '#fff' : '#f0f9ff'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: notif.read ? 600 : 700, color: notif.read ? 'var(--text-primary)' : 'var(--primary-dark)' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>{notif.time}</div>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.message}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        No notifications yet.
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/admin/notifications');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0.2rem'
                      }}
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowProfileMenu(prev => !prev)}
              role="button"
              tabIndex={0}
              title="Account Menu"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer', 
                paddingLeft: '0.75rem', 
                borderLeft: '1px solid var(--border-color)',
                userSelect: 'none'
              }}
            >
              {profilePic ? (
                <img 
                  src={profilePic} 
                  alt="Avatar" 
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary-light, #dbeafe)' }} 
                />
              ) : (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{userName}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{userRole}</div>
              </div>
              <ChevronDown size={14} color="var(--text-secondary)" />
            </div>

            {/* Profile Dropdown Popover */}
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                width: '220px',
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 0',
                zIndex: 1100
              }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userRole}</div>
                  </div>
                </div>

                <div style={{ padding: '0.25rem 0' }}>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/admin/settings');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Settings size={15} color="var(--text-secondary)" /> Settings & Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      localStorage.clear();
                      navigate('/login');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={15} color="#dc2626" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default AdminTopbar;
