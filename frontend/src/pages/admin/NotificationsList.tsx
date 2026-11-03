import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCircle2, Clock, Trash2, Filter, Search, Check, 
  ArrowRight, FileText, Users, CreditCard, AlertCircle, RefreshCw, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  time?: string;
  read: boolean;
  case_id?: string;
  lead_id?: string;
  type?: 'application' | 'lead' | 'payment' | 'system' | 'approval';
  created_at?: string;
  createdAt?: string;
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function inferNotificationType(title: string, message: string): 'application' | 'lead' | 'payment' | 'approval' | 'system' {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('approved') || t.includes('sanction') || t.includes('cleared')) return 'approval';
  if (t.includes('payment') || t.includes('paid') || t.includes('receipt') || t.includes('fees') || t.includes('upi')) return 'payment';
  if (t.includes('lead') || t.includes('enquiry') || t.includes('inquiry')) return 'lead';
  if (t.includes('case') || t.includes('application') || t.includes('document') || t.includes('upload') || t.includes('scrutiny') || t.includes('inspection')) return 'application';
  return 'system';
}

const NotificationsList: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'application' | 'lead' | 'payment'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/notifications`);
      let list: NotificationItem[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          list = data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: getRelativeTime(n.created_at || n.createdAt),
            read: Boolean(n.read),
            case_id: n.case_id || n.caseId,
            lead_id: n.lead_id || n.leadId,
            type: inferNotificationType(n.title || '', n.message || ''),
            created_at: n.created_at || n.createdAt
          }));
        }
      }

      // Check localStorage for any offline / mock notifications
      const localStr = localStorage.getItem('mock_notifications');
      if (localStr) {
        const localData = JSON.parse(localStr);
        if (Array.isArray(localData)) {
          localData.forEach((ln: any) => {
            if (!list.some(item => String(item.id) === String(ln.id))) {
              list.push({
                id: ln.id || Math.random().toString(),
                title: ln.title || 'Notification',
                message: ln.message || '',
                time: getRelativeTime(ln.time || ln.created_at),
                read: Boolean(ln.read),
                case_id: ln.case_id,
                lead_id: ln.lead_id,
                type: inferNotificationType(ln.title || '', ln.message || ''),
                created_at: ln.created_at
              });
            }
          });
        }
      }

      // Sort by newest first
      list.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    window.addEventListener('storage', loadNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadNotifications);
    };
  }, []);

  const handleMarkAsRead = async (id: string | number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`${getApiUrl()}/notifications/${id}/read`, { method: 'PATCH' });
      // Update local storage too
      const localStr = localStorage.getItem('mock_notifications');
      if (localStr) {
        const local = JSON.parse(localStr).map((n: any) => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem('mock_notifications', JSON.stringify(local));
      }
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch(`${getApiUrl()}/notifications/mark-all-read`, { method: 'POST' });
      const localStr = localStorage.getItem('mock_notifications');
      if (localStr) {
        const local = JSON.parse(localStr).map((n: any) => ({ ...n, read: true }));
        localStorage.setItem('mock_notifications', JSON.stringify(local));
      }
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`${getApiUrl()}/notifications/${id}`, { method: 'DELETE' });
      const localStr = localStorage.getItem('mock_notifications');
      if (localStr) {
        const local = JSON.parse(localStr).filter((n: any) => n.id !== id);
        localStorage.setItem('mock_notifications', JSON.stringify(local));
      }
      toast.success('Notification removed');
    } catch (e) {}
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    setNotifications([]);
    try {
      await fetch(`${getApiUrl()}/notifications/clear`, { method: 'DELETE' });
      localStorage.removeItem('mock_notifications');
      toast.success('All notifications cleared');
    } catch (e) {}
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    if (item.case_id) {
      navigate(`/admin/applications/${item.case_id}/view`);
    } else if (item.lead_id || item.type === 'lead') {
      navigate('/admin/leads');
    } else if (item.type === 'payment') {
      navigate('/admin/payments');
    } else {
      navigate('/admin/applications');
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Tab filter
      if (activeTab === 'unread' && item.read) return false;
      if (activeTab === 'application' && item.type !== 'application' && item.type !== 'approval') return false;
      if (activeTab === 'lead' && item.type !== 'lead') return false;
      if (activeTab === 'payment' && item.type !== 'payment') return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMsg = item.message.toLowerCase().includes(q);
        const matchesCase = (item.case_id || '').toLowerCase().includes(q);
        return matchesTitle || matchesMsg || matchesCase;
      }
      return true;
    });
  }, [notifications, activeTab, searchTerm]);

  const getCategoryIcon = (type?: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle2 size={18} color="#15803d" />;
      case 'payment':
        return <CreditCard size={18} color="#0284c7" />;
      case 'lead':
        return <Users size={18} color="#d97706" />;
      case 'application':
        return <FileText size={18} color="#2563eb" />;
      default:
        return <Bell size={18} color="#475569" />;
    }
  };

  const getCategoryBg = (type?: string) => {
    switch (type) {
      case 'approval':
        return '#dcfce7';
      case 'payment':
        return '#e0f2fe';
      case 'lead':
        return '#fef3c7';
      case 'application':
        return '#dbeafe';
      default:
        return '#f1f5f9';
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={24} color="var(--primary)" /> Notifications Center
            {unreadCount > 0 && (
              <span style={{ 
                fontSize: '0.8rem', 
                backgroundColor: '#ef4444', 
                color: '#ffffff', 
                padding: '0.2rem 0.65rem', 
                borderRadius: '1rem',
                fontWeight: 700 
              }}>
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Live updates on applications, lead submissions, payment verifications, and approvals.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadNotifications}
            title="Refresh notifications"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 4px rgba(30,58,138,0.2)'
              }}
            >
              <Check size={14} /> Mark All as Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.875rem',
        border: '1px solid #e2e8f0',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'application', label: 'Applications', count: notifications.filter(n => n.type === 'application' || n.type === 'approval').length },
            { id: 'lead', label: 'Leads & Enquiries', count: notifications.filter(n => n.type === 'lead').length },
            { id: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '2rem',
                border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                backgroundColor: activeTab === tab.id ? 'var(--primary)' : '#f8fafc',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
              <span style={{
                padding: '0.1rem 0.45rem',
                borderRadius: '1rem',
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: activeTab === tab.id ? '#ffffff' : '#334155',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts, case IDs..."
            style={{
              width: '100%',
              padding: '0.45rem 2rem 0.45rem 2.25rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#94a3b8'
          }}>
            <Bell size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
            {searchTerm ? 'No matching notifications' : 'No notifications in this category'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            {searchTerm ? `No results found for "${searchTerm}". Try a different keyword.` : 'When new applications are filed, payments recorded, or leads received, alerts will show up here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className="notification-card-item"
              style={{
                backgroundColor: notif.read ? '#ffffff' : '#f0f7ff',
                borderRadius: '0.875rem',
                border: notif.read ? '1px solid #e2e8f0' : '1.5px solid #93c5fd',
                padding: '1.15rem 1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: notif.read ? '0 1px 3px rgba(0,0,0,0.02)' : '0 4px 12px rgba(37,99,235,0.06)',
                position: 'relative'
              }}
            >
              {/* Left Column: Icon & Content */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                
                {/* Category Icon */}
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '0.75rem',
                  backgroundColor: getCategoryBg(notif.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {getCategoryIcon(notif.type)}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ 
                      fontSize: '0.925rem', 
                      fontWeight: notif.read ? 600 : 700, 
                      color: notif.read ? '#1e293b' : '#1e3a8a' 
                    }}>
                      {notif.title}
                    </span>

                    {!notif.read && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                        display: 'inline-block'
                      }} />
                    )}

                    {notif.case_id && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #bfdbfe'
                      }}>
                        #{notif.case_id}
                      </span>
                    )}
                  </div>

                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: notif.read ? '#475569' : '#334155', 
                    margin: 0, 
                    lineHeight: 1.5 
                  }}>
                    {notif.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.6rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> {notif.time || 'Recently'}
                    </span>

                    <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      View Details <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                    }}
                    title="Mark as read"
                    style={{
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      padding: '0.35rem 0.55rem',
                      cursor: 'pointer',
                      color: '#475569',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <Check size={13} /> Mark Read
                  </button>
                )}

                <button
                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                  title="Delete alert"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '0.35rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .notification-card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default NotificationsList;
