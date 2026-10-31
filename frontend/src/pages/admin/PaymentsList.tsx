import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Search, Download, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../config/api';

interface PaymentItem {
  id: string;
  caseId: string;
  proposalNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  staffMemberName: string;
  applicationType: string;
  estimatedAmount: number;
  amountPaid: number;
  pendingAmount: number;
  transactionId: string;
  paymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  receiptNumber: string;
  receiptUrl: string;
}

const PaymentsList: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const userRole = localStorage.getItem('userRole') || 'ADMIN';
      const staffName = localStorage.getItem('loggedInUser') || 'Admin';
      const staffId = localStorage.getItem('staffId') || '';

      const res = await fetch(`${apiUrl}/payments`, {
        headers: {
          'x-user-role': userRole,
          'x-user-name': staffName,
          'x-staff-id': staffId
        }
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => {
    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter.toUpperCase() === 'PAID' && p.paymentStatus.toUpperCase() !== 'PAID') return false;
      if (statusFilter.toUpperCase() === 'PENDING' && p.paymentStatus.toUpperCase() !== 'PENDING') return false;
      if (statusFilter.toUpperCase() === 'PARTIAL' && p.paymentStatus.toUpperCase() !== 'PARTIAL') return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.proposalNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.staffMemberName.toLowerCase().includes(q) ||
        p.transactionId.toLowerCase().includes(q) ||
        (p.customerPhone && p.customerPhone.includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalEstimated = payments.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalPending = payments.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckCircle size={13} /> Paid
        </span>
      );
    }
    if (s === 'PARTIAL') {
      return (
        <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={13} /> Partial
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <AlertCircle size={13} /> Pending
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="heading-3" style={{ margin: 0 }}>Payments & Collections</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track verified customer payments, transaction IDs, and registered staff members.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid" style={{ marginTop: '0', marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="stat-label">Total Estimated Fees</div>
          <div className="stat-value" style={{ fontSize: '1.65rem', marginTop: '0.35rem', color: 'var(--primary-dark)' }}>
            ₹{totalEstimated.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="stat-label">Total Verified Collected</div>
          <div className="stat-value" style={{ fontSize: '1.65rem', marginTop: '0.35rem', color: '#15803d' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="stat-label">Total Outstanding Pending</div>
          <div className="stat-value" style={{ fontSize: '1.65rem', marginTop: '0.35rem', color: '#b45309' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'PAID', 'PENDING', 'PARTIAL'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '2rem',
                border: statusFilter === s ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: statusFilter === s ? 'var(--primary)' : 'transparent',
                color: statusFilter === s ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {s === 'ALL' ? 'All Payments' : s}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search proposal, customer, staff, TxID..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '0.45rem 1rem 0.45rem 2.25rem',
              borderRadius: '2rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Name</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Proposal No</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Registered Staff</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App Type</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Estimated</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Paid Amount</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaction ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payment Date</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading verified payment records...
                  </td>
                </tr>
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((p, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      <div>{p.customerName}</div>
                      {p.customerPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{p.customerPhone}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Link to={`/admin/applications/${p.proposalNumber}/view`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                        #{p.proposalNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      <span style={{ fontWeight: 500, backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {p.staffMemberName}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {p.applicationType}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      ₹{p.estimatedAmount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: p.amountPaid > 0 ? '#15803d' : 'inherit' }}>
                      ₹{p.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#0f172a' }}>
                      {p.transactionId}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getStatusBadge(p.paymentStatus)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`/print/receipt/${p.proposalNumber}`, '_blank')}
                        style={{
                          background: 'rgba(11, 99, 206, 0.08)',
                          border: '1px solid var(--primary)',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          padding: '0.35rem 0.65rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                        title="Print Official A4 Payment Receipt"
                      >
                        <Printer size={13} /> Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Receipt size={36} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: '0 0 0.5rem' }}>No payment records found</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Payments verified through Step 3 Fees Details will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsList;
