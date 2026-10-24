import React from 'react';
import { Plus, Eye, MoreVertical, Users } from 'lucide-react';
import FilterPanel from '../../components/admin/FilterPanel';

const CustomersList: React.FC = () => {
  const filterOptions = [
    { key: 'location', label: 'Location', options: ['Hosur', 'Krishnagiri', 'Shoolagiri'] }
  ];

  const customers: any[] = [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <FilterPanel filters={filterOptions} onFilterChange={() => {}} onReset={() => {}} />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Details</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Location</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Applications</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payments</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length > 0 ? (
                customers.map((cust, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{cust.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cust.mobile} | {cust.id}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{cust.location}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Total: {cust.apps}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--warning-gold)' }}>Pending: {cust.pending}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--success-green)', fontWeight: 500 }}>Paid: {cust.totalPaid}</div>
                      {cust.pendingAmt !== '₹0' && <div style={{ fontSize: '0.75rem', color: 'var(--error-red)' }}>Due: {cust.pendingAmt}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-secondary)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Eye size={16} />
                        </button>
                        <button style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Users size={32} color="var(--text-secondary)" />
                      </div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No customers found</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
                        You haven't added any customers yet. Add a customer to start tracking their applications.
                      </p>
                      <button className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                        Add Customer
                      </button>
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

export default CustomersList;
