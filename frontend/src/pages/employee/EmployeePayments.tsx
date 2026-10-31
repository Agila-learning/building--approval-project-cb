import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Search, Download, Printer, CheckCircle, Clock, AlertCircle, RefreshCw, IndianRupee } from 'lucide-react';
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

const EmployeePayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const staffName = localStorage.getItem('loggedInUser') || 'Staff';
  const staffId = localStorage.getItem('staffId') || '';

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/payments`, {
        headers: {
          'x-user-role': 'STAFF',
          'x-user-name': staffName,
          'x-staff-id': staffId
        }
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff payments:', err);
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
        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={13} /> Partial
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <AlertCircle size={13} /> Pending
      </span>
    );
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Receipt style={{ color: 'var(--primary-color)' }} size={28} />
            My Customer Payments
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            View fee payments and print receipts for applications registered under <strong>{staffName}</strong>.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh Payments
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Estimated Fees</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            ₹{totalEstimated.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Across {payments.length} assigned leads</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #bbf7d0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>Total Collected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>Verified receipts recorded</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ea580c', marginTop: '0.5rem' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c2410c', marginTop: '0.25rem' }}>Pending customer collection</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-body)', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', minWidth: '280px', flex: '1 1 300px' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search by Proposal #, customer name, TxID, phone..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
          {['ALL', 'PAID', 'PENDING', 'PARTIAL'].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === st ? 'var(--primary-color)' : 'var(--border-color)',
                backgroundColor: statusFilter === st ? 'var(--primary-color)' : 'transparent',
                color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Proposal Number</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Application Type</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Est. Total</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Paid Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Transaction ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Payment Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem auto' }} />
                    Loading payment records...
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Receipt size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                    No payment records found.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p, idx) => (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                      <Link to={`/employee/applications/${p.caseId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        #{p.proposalNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.customerName}</div>
                      {p.customerPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.customerPhone}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {p.applicationType}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{p.estimatedAmount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: p.amountPaid > 0 ? '#16a34a' : 'var(--text-secondary)' }}>
                      ₹{p.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <code style={{ fontSize: '0.75rem', background: 'var(--bg-body)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}>
                        {p.transactionId}
                      </code>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getStatusBadge(p.paymentStatus)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      {p.amountPaid > 0 ? (
                        <a
                          href={`/print/receipt/${p.proposalNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'var(--primary-color)',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <Printer size={13} /> Print
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-body)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '0.25rem',
                    border: '1px solid',
                    borderColor: currentPage === page ? 'var(--primary-color)' : 'var(--border-color)',
                    backgroundColor: currentPage === page ? 'var(--primary-color)' : 'transparent',
                    color: currentPage === page ? '#ffffff' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-body)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
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

export default EmployeePayments;
