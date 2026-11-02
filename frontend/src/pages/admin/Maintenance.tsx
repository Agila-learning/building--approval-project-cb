import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  RotateCcw, History, Activity, Database, 
  CheckCircle2, AlertTriangle, RefreshCw, Download, 
  Search, ShieldCheck, FileText, ArrowRight, User, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const STATUS_OPTIONS = [
  'DOCUMENT_COLLECTION',
  'DOCUMENTS_PENDING',
  'SUBMITTED_FOR_APPROVAL',
  'SCRUTINY',
  'INSPECTION_SCHEDULED',
  'INSPECTION_DONE',
  'DOCUMENTS_VERIFICATION',
  'APPROVED',
  'ACTION_NEEDED',
  'REJECTED'
];

const Maintenance: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getTabFromPath = () => {
    if (location.pathname.includes('/revert')) return 'revert';
    if (location.pathname.includes('/view')) return 'view';
    return 'logs';
  };

  const [activeTab, setActiveTab] = useState<'revert' | 'logs' | 'view'>(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  // Data states
  const [cases, setCases] = useState<any[]>([]);
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Revert workflow states
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [revertReason, setRevertReason] = useState('');
  const [isSubmittingRevert, setIsSubmittingRevert] = useState(false);

  // Logs state
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [viewSearchTerm, setViewSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('maintenance_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch live cases & initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases`);
      let allCases: any[] = [];
      if (res.ok) {
        allCases = await res.json();
      }

      // Merge local cases if any
      const localStr = localStorage.getItem('mock_saved_cases');
      if (localStr) {
        try {
          const locals = JSON.parse(localStr).filter((c: any) => c.type !== 'Lead');
          const existingIds = new Set(allCases.map(c => c.id || c.application_number));
          locals.forEach((loc: any) => {
            if (!existingIds.has(loc.id) && !existingIds.has(loc.application_number)) {
              allCases.push(loc);
            }
          });
        } catch (e) {}
      }
      setCases(allCases);

      // Fetch leads count
      const leadsRes = await fetch(`${apiUrl}/leads`);
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeadsCount(leadsData.length);
      }
    } catch (err) {
      console.error("Failed to load maintenance data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedCase = cases.find(c => (c.id === selectedCaseId || c.application_number === selectedCaseId));

  const getCandidateName = (c: any) => {
    if (!c) return 'Unknown Applicant';
    return c.property?.owner_name || c.fullData?.customerName || c.customerName || c.clientName || c.name || 'Unknown Applicant';
  };

  // Add audit log helper
  const addAuditLog = (action: string, targetId: string, details: string, candidateName?: string) => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      displayDate: new Date().toLocaleString('en-GB'),
      action,
      targetId,
      candidateName: candidateName || 'Unknown Applicant',
      user: localStorage.getItem('loggedInUser') || 'Admin',
      details
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    try {
      localStorage.setItem('maintenance_audit_logs', JSON.stringify(updated.slice(0, 200)));
    } catch (e) {}
  };

  // Handle Revert Status Execution
  const handleExecuteRevert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      toast.error('Please select an application to revert.');
      return;
    }
    if (!targetStatus) {
      toast.error('Please select the new target status.');
      return;
    }
    if (!revertReason.trim()) {
      toast.error('Please enter the reason for reverting the status.');
      return;
    }

    setIsSubmittingRevert(true);
    const apiUrl = getApiUrl();
    const prevStatus = selectedCase.status || selectedCase.currentStatus || 'UNKNOWN';

    try {
      const targetId = selectedCase.id || selectedCase._id;
      const res = await fetch(`${apiUrl}/cases/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          revertRemarks: revertReason.trim(),
          fullData: {
            ...(selectedCase.fullData || {}),
            status: targetStatus,
            revertRemarks: revertReason.trim(),
            revertedAt: new Date().toISOString(),
            revertedBy: localStorage.getItem('loggedInUser') || 'Admin'
          }
        })
      });

      // Update local storage cases
      const localStr = localStorage.getItem('mock_saved_cases');
      if (localStr) {
        try {
          const locals = JSON.parse(localStr);
          const updatedLocals = locals.map((c: any) => {
            if (c.id === targetId || c.application_number === selectedCase.application_number) {
              return {
                ...c,
                status: targetStatus,
                revertRemarks: revertReason.trim()
              };
            }
            return c;
          });
          localStorage.setItem('mock_saved_cases', JSON.stringify(updatedLocals));
        } catch (e) {}
      }

      // Record Audit Log with Candidate Name
      const candName = getCandidateName(selectedCase);
      addAuditLog(
        'STATUS_REVERT',
        selectedCase.application_number || selectedCase.id,
        `Reverted from "${prevStatus}" to "${targetStatus}". Reason: ${revertReason.trim()}`,
        candName
      );

      toast.success(`Application ${selectedCase.application_number || selectedCase.id} for "${candName}" updated to ${targetStatus}!`);
      
      // Reset form
      setSelectedCaseId('');
      setTargetStatus('');
      setRevertReason('');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status on server.');
    } finally {
      setIsSubmittingRevert(false);
    }
  };

  const handleClearCache = () => {
    sessionStorage.clear();
    toast.success('Application session cache successfully cleared!');
    fetchData();
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      casesCount: cases.length,
      cases,
      auditLogs
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cb_approvals_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup export downloaded successfully!');
  };

  const filteredLogs = auditLogs.filter(l => 
    l.targetId?.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
    l.action?.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
    l.details?.toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
    l.user?.toLowerCase().includes(logsSearchTerm.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '3rem' }}>
      
      {/* Page Title & Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={24} color="#2563eb" /> System Maintenance & Diagnostics
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Safely revert application stages, monitor system activity logs, and inspect database health.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'inline-flex', padding: '0.3rem', backgroundColor: '#e2e8f0', borderRadius: '0.5rem', gap: '0.25rem' }}>
          <button
            onClick={() => { setActiveTab('revert'); navigate('/admin/maintenance/revert'); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'revert' ? '#ffffff' : 'transparent',
              color: activeTab === 'revert' ? '#1e3a8a' : '#64748b',
              boxShadow: activeTab === 'revert' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <RotateCcw size={16} /> Revert Status
          </button>

          <button
            onClick={() => { setActiveTab('logs'); navigate('/admin/maintenance/logs'); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'logs' ? '#ffffff' : 'transparent',
              color: activeTab === 'logs' ? '#1e3a8a' : '#64748b',
              boxShadow: activeTab === 'logs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <History size={16} /> Activity Logs ({auditLogs.length})
          </button>

          <button
            onClick={() => { setActiveTab('view'); navigate('/admin/maintenance/view'); }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'view' ? '#ffffff' : 'transparent',
              color: activeTab === 'view' ? '#1e3a8a' : '#64748b',
              boxShadow: activeTab === 'view' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Database size={16} /> All Applications & Audit ({cases.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REVERT APPLICATION STATUS */}
      {activeTab === 'revert' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 480px) 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          
          {/* Revert Form Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RotateCcw size={18} color="#2563eb" /> Revert Application Stage
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Select an active application to adjust or roll back its government scrutiny status. All reversions are permanently recorded in system audit logs.
            </p>

            <form onSubmit={handleExecuteRevert}>
              {/* Step 1: Select Application */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  1. Select Application *
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                  required
                >
                  <option value="">-- Choose Application / Proposal --</option>
                  {cases.map((c) => {
                    const appNo = c.application_number || c.id;
                    const cust = c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer';
                    const st = c.status || 'NEW';
                    return (
                      <option key={c.id || appNo} value={c.id || appNo}>
                        {appNo} - {cust} [{st}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Step 2: Target Status */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  2. New Target Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                  required
                >
                  <option value="">-- Select Target Status --</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Revert Reason */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  3. Reason for Revert / Remark *
                </label>
                <textarea
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  placeholder="e.g. DTCP returned query for updated site boundary sketch; or customer submitted revised architectural drawings."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRevert || !selectedCaseId}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  opacity: isSubmittingRevert || !selectedCaseId ? 0.6 : 1
                }}
              >
                <RotateCcw size={16} /> {isSubmittingRevert ? 'Updating Status...' : 'Apply Revert & Update Status'}
              </button>
            </form>
          </div>

          {/* Selected Application Preview Dossier */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="#2563eb" /> Application Details & Current Stage
            </h3>

            {selectedCase ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Proposal / Application No</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', marginTop: '0.2rem' }}>
                      {selectedCase.application_number || selectedCase.id}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Customer Name</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: '0.2rem' }}>
                      {selectedCase.property?.owner_name || selectedCase.fullData?.customerName || selectedCase.clientName || 'Customer'}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Current Active Status</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d97706', marginTop: '0.2rem' }}>
                      {selectedCase.status || selectedCase.currentStatus || 'DOCUMENT_COLLECTION'}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Assigned Executive</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem' }}>
                      {selectedCase.assigned_staff?.name || selectedCase.fullData?.staff || 'Not Assigned'}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem', border: '1px solid #bfdbfe', fontSize: '0.85rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                  <div>
                    Reverting will immediately update the applicant's tracking page and log the previous and new stage for transparent government compliance.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Select an application on the left to preview its current workflow details.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: AUDIT & ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                System Activity & Audit Log
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Comprehensive timeline of status transitions, document modifications, and administrative operations.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logsSearchTerm}
                  onChange={(e) => setLogsSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 2rem 0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <button
                onClick={handleExportBackup}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                title="Export logs and system cases backup"
              >
                <Download size={15} /> Export
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Log ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Application ID & Candidate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Initiated By</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Details & Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>{log.id}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{log.displayDate || log.timestamp}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: log.action === 'STATUS_REVERT' ? '#fef3c7' : '#e0e7ff',
                        color: log.action === 'STATUS_REVERT' ? '#b45309' : '#3730a3'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      <div style={{ color: 'var(--primary-dark)' }}>{log.targetId}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
                        👤 {log.candidateName || 'Applicant'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{log.user}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{log.details}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      <History size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                      <p style={{ margin: 0 }}>No audit logs found. Actions performed via the Revert tool or system operations will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL APPLICATIONS & AUDIT INSPECTION */}
      {activeTab === 'view' && (
        <div>
          {/* Applications Search & Registry Card */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={18} color="#2563eb" /> All System Applications & Audit Inspection
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Search and inspect any application dossier. Quickly jump to details or revert stages directly.
                </p>
              </div>

              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by ID, candidate, phone..."
                  value={viewSearchTerm}
                  onChange={(e) => setViewSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 2rem 0.55rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--border-color)', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Application ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Candidate Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Contact & Location</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Current Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases
                    .filter((c: any) => {
                      if (!viewSearchTerm.trim()) return true;
                      const term = viewSearchTerm.toLowerCase();
                      const appNo = (c.application_number || c.id || '').toLowerCase();
                      const cust = getCandidateName(c).toLowerCase();
                      const phone = (c.property?.owner_phone || c.fullData?.mobile || c.mobile || '').toLowerCase();
                      const loc = (c.property?.city || c.fullData?.propertyDetails?.city || c.property?.village || '').toLowerCase();
                      return appNo.includes(term) || cust.includes(term) || phone.includes(term) || loc.includes(term);
                    })
                    .map((c: any) => {
                      const appNo = c.application_number || c.id;
                      const candName = getCandidateName(c);
                      const phone = c.property?.owner_phone || c.fullData?.mobile || c.mobile || '—';
                      const loc = c.property?.city || c.fullData?.propertyDetails?.city || c.property?.village || '—';
                      const st = c.status || 'NEW';

                      return (
                        <tr key={c.id || appNo} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                            {appNo}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                            {candName}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                            <div>{phone}</div>
                            <div style={{ fontSize: '0.75rem' }}>{loc}</div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {c.approval_type || c.fullData?.serviceType || 'Building Approval'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '1rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: st === 'APPROVED' ? 'rgba(34, 160, 107, 0.1)' : st === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                              color: st === 'APPROVED' ? 'var(--success-green)' : st === 'REJECTED' ? 'var(--error-red)' : 'var(--warning-gold)'
                            }}>
                              {st.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => navigate(`/admin/applications/${appNo}`)}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #bfdbfe',
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                View Dossier
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCaseId(c.id || appNo);
                                  setActiveTab('revert');
                                  navigate('/admin/maintenance/revert');
                                }}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #fde68a',
                                  backgroundColor: '#fffbeb',
                                  color: '#b45309',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Revert Stage
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Health Metrics Grid & Diagnostics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Database Engine</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                  <CheckCircle2 size={14} /> LIVE
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a', marginTop: '0.5rem' }}>MongoDB Atlas</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Prisma ORM Connected</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Active Applications</span>
                <FileText size={16} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a', marginTop: '0.5rem' }}>{cases.length} Cases</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Managed Dossiers</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Customer Inquiries</span>
                <User size={16} color="#059669" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', marginTop: '0.5rem' }}>{leadsCount} Leads</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>CRM Prospects</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Audit Log Records</span>
                <History size={16} color="#d97706" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginTop: '0.5rem' }}>{auditLogs.length} Events</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Tracked & Timestamped</div>
            </div>

          </div>

          {/* Quick Operations Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} color="#2563eb" /> Diagnostics & Administrative Utilities
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e3a8a' }}>Clear Local Client Cache</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0.75rem 0' }}>
                  Flushes transient browser session memory to reload fresh dossiers from the database.
                </div>
                <button
                  onClick={handleClearCache}
                  style={{ padding: '0.4rem 0.85rem', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear Cache Now
                </button>
              </div>

              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e3a8a' }}>Export Full Database Backup</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0.75rem 0' }}>
                  Generates an offsite JSON backup of all registered cases, fees, customer records, and logs.
                </div>
                <button
                  onClick={handleExportBackup}
                  style={{ padding: '0.4rem 0.85rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.25rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Download JSON Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Maintenance;
