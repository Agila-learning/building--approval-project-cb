import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Info, Pencil, ArrowUpDown, Search, FileText, ArrowRight, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/admin/StatusBadge';
import { recentApplications } from '../../data/mockData';
import { getApplicationStatus } from '../../utils/statusHelper';
import { getApiUrl } from '../../config/api';

const isDocsPendingStatus = (status: string, rawStatus?: string) => {
  const s = (status || '').toUpperCase();
  const r = (rawStatus || '').toUpperCase();
  const targets = ['DOCUMENT_COLLECTION', 'ACTION_NEEDED', 'ACTION REQUIRED', 'INTAKE', 'PENDING_DOCUMENTS', 'DOCUMENTS PENDING', 'DRAFT', 'NEW'];
  return targets.includes(s) || targets.includes(r);
};

const isGovReviewStatus = (status: string, rawStatus?: string) => {
  const s = (status || '').toUpperCase();
  const r = (rawStatus || '').toUpperCase();
  const targets = ['SUBMITTED', 'SUBMITTED_FOR_APPROVAL', 'SCRUTINY', 'INSPECTION_SCHEDULED', 'INSPECTION_DONE', 'DOCUMENTS_VERIFICATION', 'DOCUMENTS_VERIFIED', 'GOV VERIFICATION', 'UNDER REVIEW', 'SITE INSPECTION', 'VERIFICATION'];
  return targets.includes(s) || targets.includes(r);
};

const isApprovedStatus = (status: string, rawStatus?: string) => {
  const s = (status || '').toUpperCase();
  const r = (rawStatus || '').toUpperCase();
  return ['APPROVED', 'COMPLETED'].includes(s) || ['APPROVED', 'COMPLETED'].includes(r);
};

const isRejectedStatus = (status: string, rawStatus?: string) => {
  const s = (status || '').toUpperCase();
  const r = (rawStatus || '').toUpperCase();
  return s === 'REJECTED' || r === 'REJECTED';
};

const isActiveStatus = (status: string, rawStatus?: string) => {
  return !isApprovedStatus(status, rawStatus) && !isRejectedStatus(status, rawStatus);
};

const isCurrentMonthApp = (app: any) => {
  const now = new Date();
  let appDate: Date | null = null;
  if (app.created_at) appDate = new Date(app.created_at);
  else if (app.createdAt) appDate = new Date(app.createdAt);
  else if (app.date && !isNaN(new Date(app.date).getTime())) appDate = new Date(app.date);
  if (!appDate || isNaN(appDate.getTime())) return false;
  return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
};

const ApplicationsList: React.FC = () => {
  const [applications, setApplications] = React.useState<any[]>(recentApplications);
  const [staffMembers, setStaffMembers] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterOn, setFilterOn] = React.useState('select');
  const [subFilter, setSubFilter] = React.useState('select');
  const location = useLocation();
  const navigate = useNavigate();
  
  const isMaintenanceLogs = location.pathname.includes('/maintenance/logs');
  const isMaintenanceView = location.pathname.includes('/maintenance/view');
  const isMaintenanceRevert = location.pathname.includes('/maintenance/revert');
  const isMainList = !isMaintenanceLogs && !isMaintenanceView && !isMaintenanceRevert;

  // Parse URL search parameters
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const filterParam = searchParams.get('filter'); // 'all', 'active', 'current_month'
  const statusParam = searchParams.get('status'); // 'docs_pending', 'gov_review', 'approved', 'rejected', or specific status name
  const queryParam = searchParams.get('search') || searchParams.get('q');

  // Synchronize search input with URL search param if provided
  React.useEffect(() => {
    if (queryParam !== null) {
      setSearchTerm(queryParam);
    }
  }, [queryParam]);

  const fetchCases = React.useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases`);
      if (res.ok) {
        const casesData = await res.json();
        const localCasesStr = localStorage.getItem('mock_saved_cases');
        const localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];
        const allCases = [...casesData, ...localCases];
        
        let mappedApps = allCases.map((c: any) => ({
          id: c.application_number || c.id,
          mongoId: c.id,
          customer: c.property?.owner_name || c.fullData?.customerName || 'Unknown',
          mobile: c.property?.owner_phone || c.fullData?.mobile || '',
          location: c.fullData?.propertyDetails?.city || c.property?.city || c.property?.jurisdiction || c.property?.village || '',
          type: 'Building',
          appType: c.approval_type || c.fullData?.serviceType || 'Building Approval',
          status: getApplicationStatus(c.application_number || c.id, c.status, c),
          rawStatus: c.status,
          created_at: c.created_at || c.createdAt || c.date,
          staff: c.assigned_staff?.name || c.fullData?.staff || 'Unassigned',
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          days: (() => {
               if (!c.created_at) return 0;
               const start = new Date(c.created_at).getTime();
               const isCompleted = ['Rejected', 'Approved', 'Completed'].includes(c.status);
               const end = isCompleted && c.updated_at ? new Date(c.updated_at).getTime() : new Date().getTime();
               return Math.ceil(Math.max(0, end - start) / (1000 * 60 * 60 * 24));
          })()
        }));
        
        // Remove duplicates based on ID
        mappedApps = mappedApps.filter((app: any, index: number, self: any[]) => 
          index === self.findIndex((a: any) => a.id === app.id)
        );
        
        setApplications(mappedApps);
      } else {
        const localCasesStr = localStorage.getItem('mock_saved_cases');
        const localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];
        if (localCases.length > 0) {
          const mappedApps = localCases.map((c: any) => ({
            id: c.application_number || c.id,
            mongoId: c.id,
            customer: c.property?.owner_name || c.fullData?.customerName || 'Unknown',
            mobile: c.property?.owner_phone || c.fullData?.mobile || '',
            location: c.fullData?.propertyDetails?.city || c.property?.city || c.property?.jurisdiction || c.property?.village || '',
            type: 'Building',
            appType: c.approval_type || c.fullData?.serviceType || 'Building Approval',
            status: getApplicationStatus(c.application_number || c.id, c.status, c),
            rawStatus: c.status,
            created_at: c.created_at || c.createdAt || c.date,
            staff: c.assigned_staff?.name || c.fullData?.staff || 'Unassigned',
            date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            days: 0
          }));
          setApplications(mappedApps);
        } else {
          setApplications([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
      const localCasesStr = localStorage.getItem('mock_saved_cases');
      const localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];
      if (localCases.length > 0) {
        const mappedApps = localCases.map((c: any) => ({
          id: c.application_number || c.id,
          mongoId: c.id,
          customer: c.property?.owner_name || c.fullData?.customerName || 'Unknown',
          mobile: c.property?.owner_phone || c.fullData?.mobile || '',
          location: c.fullData?.propertyDetails?.city || c.property?.city || c.property?.jurisdiction || c.property?.village || '',
          type: 'Building',
          appType: c.approval_type || c.fullData?.serviceType || 'Building Approval',
          status: getApplicationStatus(c.application_number || c.id, c.status, c),
          rawStatus: c.status,
          created_at: c.created_at || c.createdAt || c.date,
          staff: c.assigned_staff?.name || c.fullData?.staff || 'Unassigned',
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          days: 0
        }));
        setApplications(mappedApps);
      } else {
        setApplications([]);
      }
    }
  }, []);

  React.useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 10000);
    window.addEventListener('storage', fetchCases);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchCases);
    };
  }, [fetchCases]);

  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users`);
        if (res.ok) {
          const list = await res.json();
          setStaffMembers(list.filter((u: any) => u.status === 'Active' && u.role === 'STAFF'));
        }
      } catch (err) {
        console.error("Failed to load staff list in ApplicationsList:", err);
      }
    };
    fetchStaff();
  }, []);

  const handleAssignStaff = async (app: any, staffName: string) => {
    const targetId = app.mongoId || app.id;
    setApplications(prev => prev.map(a => (a.id === app.id || a.mongoId === app.mongoId) ? { ...a, staff: staffName } : a));
    
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff: staffName })
      });
      if (res.ok) {
        toast.success(staffName ? `Application assigned to ${staffName}` : 'Staff assignment removed');
      } else {
        toast.error('Failed to update staff assignment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update staff assignment');
    }
  };

  // Counts for quick filter tabs
  const filterCounts = React.useMemo(() => {
    return {
      all: applications.length,
      active: applications.filter(a => isActiveStatus(a.status, a.rawStatus)).length,
      docsPending: applications.filter(a => isDocsPendingStatus(a.status, a.rawStatus)).length,
      govReview: applications.filter(a => isGovReviewStatus(a.status, a.rawStatus)).length,
      approved: applications.filter(a => isApprovedStatus(a.status, a.rawStatus)).length,
      rejected: applications.filter(a => isRejectedStatus(a.status, a.rawStatus)).length,
      currentMonth: applications.filter(a => isCurrentMonthApp(a)).length,
    };
  }, [applications]);

  // Determine current active filter key
  const activeFilterKey = React.useMemo(() => {
    if (filterParam === 'current_month' && !statusParam) return 'current_month';
    if (statusParam) return statusParam.toLowerCase();
    if (filterParam) return filterParam.toLowerCase();
    return '';
  }, [filterParam, statusParam]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.appType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.mobile || '').includes(searchTerm);

    let matchesFilter = true;
    if (filterOn === 'Product' && subFilter !== 'select') {
      matchesFilter = (app.appType || '').toLowerCase().includes(subFilter.toLowerCase());
    } else if (filterOn === 'Status' && subFilter !== 'select') {
      matchesFilter = app.status.toLowerCase() === subFilter.toLowerCase() ||
                      (app.rawStatus && app.rawStatus.toLowerCase() === subFilter.toLowerCase());
    }

    // Match URL filter param
    let matchesUrlFilter = true;
    if (filterParam === 'all') {
      matchesUrlFilter = true;
    } else if (filterParam === 'active') {
      matchesUrlFilter = isActiveStatus(app.status, app.rawStatus);
    } else if (filterParam === 'current_month') {
      matchesUrlFilter = isCurrentMonthApp(app);
    }

    // Match status param (combines with filterParam if both present)
    if (statusParam && matchesUrlFilter) {
      const sp = statusParam.toLowerCase();
      if (sp === 'active') {
        matchesUrlFilter = isActiveStatus(app.status, app.rawStatus);
      } else if (sp === 'docs_pending') {
        matchesUrlFilter = isDocsPendingStatus(app.status, app.rawStatus);
      } else if (sp === 'gov_review') {
        matchesUrlFilter = isGovReviewStatus(app.status, app.rawStatus);
      } else if (sp === 'approved') {
        matchesUrlFilter = isApprovedStatus(app.status, app.rawStatus);
      } else if (sp === 'rejected') {
        matchesUrlFilter = isRejectedStatus(app.status, app.rawStatus);
      } else {
        matchesUrlFilter = app.status.toLowerCase() === sp ||
                           (app.rawStatus && app.rawStatus.toLowerCase() === sp);
      }
    }

    let matchesMaintenance = true;
    const isCompleted = isApprovedStatus(app.status, app.rawStatus) || isRejectedStatus(app.status, app.rawStatus);
    
    if (isMaintenanceLogs) {
      matchesMaintenance = isCompleted; // Only show completed in logs
    } else if (isMaintenanceRevert || isMaintenanceView) {
      matchesMaintenance = true;
    } else if (isMainList) {
      // If user explicitly applied a filter via URL or dropdown, DO NOT hide completed cases!
      const hasExplicitFilter = Boolean(filterParam || statusParam || (filterOn === 'Status' && subFilter !== 'select') || (filterOn === 'Product' && subFilter !== 'select'));
      if (!hasExplicitFilter) {
        matchesMaintenance = !isCompleted; // Hide completed in default main list
      }
    }

    return matchesSearch && matchesFilter && matchesUrlFilter && matchesMaintenance;
  });

  const getActiveFilterLabel = () => {
    const parts: string[] = [];
    if (filterParam === 'all') parts.push('All Applications');
    if (filterParam === 'active') parts.push('Active');
    if (filterParam === 'current_month') parts.push('Current Month');
    if (statusParam === 'docs_pending') parts.push('Pending Documents');
    else if (statusParam === 'gov_review') parts.push('Government Review');
    else if (statusParam === 'approved') parts.push('Approved');
    else if (statusParam === 'rejected') parts.push('Rejected');
    else if (statusParam === 'active' && !parts.includes('Active')) parts.push('Active');
    else if (statusParam) parts.push(`Status: ${statusParam}`);
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const clearFilters = () => {
    setFilterOn('select');
    setSubFilter('select');
    setSearchTerm('');
    navigate('/admin/applications', { replace: true });
  };

  const handleQuickFilter = (type: 'filter' | 'status', value: string) => {
    if (type === 'filter') {
      if (filterParam === value) {
        navigate('/admin/applications');
      } else {
        navigate(`/admin/applications?filter=${value}`);
      }
    } else {
      if (statusParam === value) {
        navigate('/admin/applications');
      } else {
        navigate(`/admin/applications?status=${value}`);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
          {isMaintenanceLogs ? 'Maintenance Logs' : 
           isMaintenanceView ? 'Maintenance View' : 
           isMaintenanceRevert ? 'Maintenance Revert' : 'Applications'}
        </h1>
        {isMainList && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }} onClick={() => navigate('/admin/applications/new')}>
            <Plus size={18} /> New Application
          </button>
        )}
      </div>

      {/* Quick Action Filter Chips */}
      {isMainList && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '0.75rem', 
          marginBottom: '1rem',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
            <Filter size={14} /> Quick Filter:
          </span>

          <button
            onClick={() => handleQuickFilter('filter', 'all')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'all' ? '1px solid #1e3a8a' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'all' ? '#1e3a8a' : 'var(--bg-surface)',
              color: activeFilterKey === 'all' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            All <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.all}</span>
          </button>

          <button
            onClick={() => handleQuickFilter('filter', 'active')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'active' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'active' ? 'var(--accent)' : 'var(--bg-surface)',
              color: activeFilterKey === 'active' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Active <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'active' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.active}</span>
          </button>

          <button
            onClick={() => handleQuickFilter('status', 'docs_pending')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'docs_pending' ? '1px solid var(--warning)' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'docs_pending' ? 'var(--warning)' : 'var(--bg-surface)',
              color: activeFilterKey === 'docs_pending' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Pending Docs <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'docs_pending' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.docsPending}</span>
          </button>

          <button
            onClick={() => handleQuickFilter('status', 'gov_review')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'gov_review' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'gov_review' ? 'var(--primary)' : 'var(--bg-surface)',
              color: activeFilterKey === 'gov_review' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Gov Review <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'gov_review' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.govReview}</span>
          </button>

          <button
            onClick={() => handleQuickFilter('status', 'approved')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'approved' ? '1px solid var(--success-green)' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'approved' ? 'var(--success-green)' : 'var(--bg-surface)',
              color: activeFilterKey === 'approved' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Approved <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'approved' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.approved}</span>
          </button>

          <button
            onClick={() => handleQuickFilter('status', 'rejected')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'rejected' ? '1px solid var(--error-red)' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'rejected' ? 'var(--error-red)' : 'var(--bg-surface)',
              color: activeFilterKey === 'rejected' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Rejected <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'rejected' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.rejected}</span>
          </button>

          <button
            onClick={() => handleQuickFilter('filter', 'current_month')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '2rem',
              border: activeFilterKey === 'current_month' ? '1px solid var(--primary-dark)' : '1px solid var(--border-color)',
              backgroundColor: activeFilterKey === 'current_month' ? 'var(--primary-dark)' : 'var(--bg-surface)',
              color: activeFilterKey === 'current_month' ? '#ffffff' : 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Current Month <span style={{ padding: '0.1rem 0.45rem', borderRadius: '1rem', backgroundColor: activeFilterKey === 'current_month' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)', fontSize: '0.75rem' }}>{filterCounts.currentMonth}</span>
          </button>

          {(filterParam || statusParam || searchTerm || filterOn !== 'select') && (
            <button
              onClick={clearFilters}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '2rem',
                border: '1px dashed var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--accent)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap'
              }}
              title="Reset all filters"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>Proposal Process</h2>
              {getActiveFilterLabel() && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  backgroundColor: 'rgba(30, 58, 138, 0.08)',
                  color: 'var(--primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600
                }}>
                  <span>Filtered: {getActiveFilterLabel()}</span>
                  <button
                    onClick={clearFilters}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary)' }}
                    title="Remove filter"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter On:</label>
                <select 
                  value={filterOn} 
                  onChange={(e) => { setFilterOn(e.target.value); setSubFilter('select'); }}
                  style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', minWidth: '150px', backgroundColor: 'var(--bg-surface)' }}
                >
                  <option value="select">select</option>
                  <option value="Product">Product</option>
                  <option value="Status">Status</option>
                </select>
              </div>
              
              {filterOn !== 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select {filterOn}:</label>
                  <select 
                    value={subFilter} 
                    onChange={(e) => setSubFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', minWidth: '150px', backgroundColor: 'var(--bg-surface)' }}
                  >
                    <option value="select">select</option>
                    {filterOn === 'Product' && (
                      <>
                        <option value="Building Approval">Building Approval</option>
                        <option value="Plan Approval">Plan Approval</option>
                        <option value="Occupancy Cert">Occupancy Cert</option>
                        <option value="Regularisation">Regularisation</option>
                      </>
                    )}
                    {filterOn === 'Status' && (
                      <>
                        <option value="New">New</option>
                        <option value="Documents Pending">Documents Pending</option>
                        <option value="Verification">Verification</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div style={{ position: 'relative', width: '300px', alignSelf: 'flex-end' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search any Values.." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'transparent' }}
            />
          </div>
        </div>
        
        <div style={{ padding: '0 1.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Total {filteredApplications.length} Records</div>
          {filteredApplications.length !== applications.length && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              (Filtered from {applications.length} total)
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a8a', borderBottom: '1px solid var(--border-color)' }}>
                {isMaintenanceRevert ? (
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>Revert</th>
                ) : (
                  <>
                    {!isMaintenanceView && !isMaintenanceLogs && (
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', width: '50px' }}>Edit</th>
                    )}
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', width: '50px' }}>View</th>
                  </>
                )}
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Proposal No <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Customer Name <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Mobile Number <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Current Status <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Proposal Date <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Product <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Assigned To <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>No of Days <ArrowUpDown size={12} style={{ opacity: 0.7 }} /></div></th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'white', textAlign: 'center', width: '50px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app, index) => (
                  <tr 
                    key={index} 
                    onClick={() => navigate(`/admin/applications/${app.id}`)}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(237, 231, 218, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {isMaintenanceRevert ? (
                      <td style={{ padding: '0.75rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to revert this application to Documents Pending?')) {
                              try {
                                const apiUrl = getApiUrl();
                                await fetch(`${apiUrl}/cases/${app.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'Documents Pending' })
                                });
                                const localCasesStr = localStorage.getItem('mock_saved_cases');
                                if (localCasesStr) {
                                  const localCases = JSON.parse(localCasesStr);
                                  const cIndex = localCases.findIndex((c: any) => c.id === app.id || c.application_number === app.id);
                                  if (cIndex !== -1) {
                                    localCases[cIndex].status = 'Documents Pending';
                                    localStorage.setItem('mock_saved_cases', JSON.stringify(localCases));
                                  }
                                }
                                window.dispatchEvent(new Event('storage'));
                                alert('Application reverted to Documents Pending.');
                                fetchCases();
                              } catch(e) {}
                            }
                          }}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '0.25rem', backgroundColor: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Revert
                        </button>
                      </td>
                    ) : (
                      <>
                        {!isMaintenanceView && !isMaintenanceLogs && (
                          <td style={{ padding: '0.75rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => navigate(`/admin/applications/${app.id}?edit=true`)}
                              style={{ padding: '0.4rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                              title="Edit Application"
                            >
                              <Pencil size={16} />
                            </button>
                          </td>
                        )}
                        <td style={{ padding: '0.75rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => navigate(`/admin/applications/${app.id}`)}
                            style={{ padding: '0.4rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                            title="View Details"
                          >
                            <Info size={16} />
                          </button>
                        </td>
                      </>
                    )}
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link to={`/admin/applications/${app.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                          {app.id}
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{app.customer}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.mobile || '—'}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge type="status" value={app.status} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {app.date}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{app.type} - {app.appType}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={app.staff && app.staff !== 'Unassigned' ? app.staff : ''}
                        onChange={(e) => handleAssignStaff(app, e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.8rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border-color)',
                          backgroundColor: app.staff && app.staff !== 'Unassigned' ? '#eff6ff' : '#fff',
                          color: app.staff && app.staff !== 'Unassigned' ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: app.staff && app.staff !== 'Unassigned' ? 600 : 400,
                          cursor: 'pointer',
                          outline: 'none',
                          maxWidth: '150px'
                        }}
                      >
                        <option value="">Unassigned</option>
                        {staffMembers.map((s: any) => (
                          <option key={s.id} value={s.name}>{s.name} ({s.staffId || 'Staff'})</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      {app.days !== undefined ? `${app.days} ${app.days === 1 ? 'day' : 'days'}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/applications/${app.id}`);
                        }}
                        title="Open Application"
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.35rem', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <FileText size={32} color="var(--text-secondary)" />
                      </div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No applications found</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
                        {getActiveFilterLabel() 
                          ? `There are currently no applications matching filter "${getActiveFilterLabel()}".` 
                          : 'There are currently no applications matching your criteria. Create a new application to get started.'}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {(filterParam || statusParam || searchTerm || filterOn !== 'select') && (
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }} 
                            onClick={clearFilters}
                          >
                            Clear Filters
                          </button>
                        )}
                        <button className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => navigate('/admin/applications/new')}>
                          Create Application
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div>Showing {filteredApplications.length > 0 ? 1 : 0} to {filteredApplications.length} of {filteredApplications.length} entries</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', cursor: 'pointer' }}>Previous</button>
            <button style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: '1px solid var(--primary)', backgroundColor: 'var(--primary)', color: 'white', cursor: 'pointer' }}>1</button>
            <button style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsList;
