import React from 'react';
import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import FilterPanel from '../../components/admin/FilterPanel';

const PaymentsList: React.FC = () => {
  const [payments, setPayments] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});
  
  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
        const res = await fetch(`${apiUrl}/cases`);
        let casesData = [];
        if (res.ok) {
          casesData = await res.json();
        }

        const mappedPayments = casesData.map((c: any) => {
          const total = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
          const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
          const pending = c.fees?.pending !== undefined && c.fees?.pending !== null 
            ? Number(c.fees.pending) 
            : Math.max(0, total - paid);

          let status: 'Pending' | 'Partial' | 'Paid' = 'Pending';
          if (pending === 0 && total > 0) {
            status = 'Paid';
          } else if (paid > 0 && pending > 0) {
            status = 'Partial';
          } else {
            status = 'Pending';
          }

          return {
            id: c.application_number || c.id,
            mongoId: c.id,
            customer: c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer',
            type: c.approval_type || c.type || 'Building Plan Approval',
            totalAmount: total,
            paidAmount: paid,
            pendingAmount: pending,
            status: status,
            date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A',
            mobile: c.property?.owner_phone || c.fullData?.mobile || c.mobile || ''
          };
        });
        setPayments(mappedPayments);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      }
    };
    
    fetchCases();
  }, []);

  const filterOptions = [
    { key: 'status', label: 'Payment Status', options: ['Paid', 'Pending', 'Partial'] }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilterValues({});
    setSearchTerm('');
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = searchTerm === '' || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.mobile && p.mobile.toLowerCase().includes(searchTerm.toLowerCase()));

    // User requirement: completely paid details not needed to show by default; only pending / partial datas needed
    const isPaidStatus = p.status.toLowerCase() === 'paid' || p.pendingAmount <= 0;
    if (!filterValues.status || filterValues.status === '' || filterValues.status.toLowerCase() === 'all') {
      if (isPaidStatus) return false; // Hide completely paid items
    } else if (filterValues.status.toLowerCase() !== p.status.toLowerCase()) {
      return false;
    }

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return { bg: 'rgba(47, 125, 90, 0.1)', text: '#2F7D5A' };
      case 'Pending': return { bg: 'rgba(201, 138, 61, 0.1)', text: '#C98A3D' };
      case 'Partial': return { bg: 'rgba(26, 75, 130, 0.1)', text: '#1A4B82' };
      default: return { bg: '#eee', text: '#333' };
    }
  };



  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="heading-3">Payments & Invoices</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Receipt size={18} /> Generate Bulk Invoice
        </button>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '0', marginBottom: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>₹{payments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="stat-label">Collected</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: '#2F7D5A' }}>₹{payments.reduce((sum, p) => sum + p.paidAmount, 0).toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.5rem', color: '#C98A3D' }}>₹{payments.reduce((sum, p) => sum + p.pendingAmount, 0).toLocaleString()}</div>
        </div>
      </div>

      <FilterPanel 
        filters={filterOptions} 
        onFilterChange={handleFilterChange} 
        onReset={handleReset} 
        onExport={() => {}} 
        onSearch={setSearchTerm}
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>App ID & Customer</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Amount</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Paid</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pending</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p, index) => {
                  const statusColors = getStatusColor(p.status);
                  return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <Link to={`/admin/payments/${p.id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'block' }}>{p.id}</Link>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p.customer}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>₹{p.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#2F7D5A' }}>₹{p.paidAmount.toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem', color: p.pendingAmount > 0 ? '#C98A3D' : 'inherit' }}>₹{p.pendingAmount.toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: statusColors.bg,
                        color: statusColors.text
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Receipt size={32} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)' }}>No payments found</h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsList;
