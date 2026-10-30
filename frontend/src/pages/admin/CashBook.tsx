import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

interface Transaction {
  id: string;
  date: string;
  rawDate: string;
  particulars: string;
  type: 'Receipt' | 'Expense';
  amount: number;
}

const CashBook: React.FC = () => {
  // Set default date range to cover the current month so transactions are immediately visible
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const openingBalance = 0;

  const loadAllTransactions = async () => {
    setLoading(true);
    const combined: Transaction[] = [];

    // 1. Fetch collections/receipts from backend cases
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases`);
      if (res.ok) {
        const cases = await res.json();
        cases.forEach((c: any) => {
          const appNo = c.application_number || c.id;
          const custName = c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer';
          const service = c.approval_type || c.type || 'Building Plan Approval';

          // Extract charges if recorded
          const charges: any[] = c.fees?.charges || c.fullData?.fees?.charges || [];
          if (charges.length > 0) {
            charges.forEach((ch: any) => {
              const dt = ch.date ? new Date(ch.date) : (c.created_at ? new Date(c.created_at) : new Date());
              const dateIso = !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : todayStr;
              combined.push({
                id: ch.id || `FEE-${appNo.slice(-4)}`,
                date: dateIso,
                rawDate: dateIso,
                particulars: `${custName} - ${service} (${ch.description || 'Fee Payment'})`,
                type: 'Receipt',
                amount: Number(ch.amount) || 0
              });
            });
          } else {
            // If case has paid amount recorded directly
            const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
            if (paid > 0) {
              const dt = c.created_at ? new Date(c.created_at) : new Date();
              const dateIso = !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : todayStr;
              combined.push({
                id: `COL-${appNo.slice(-6)}`,
                date: dateIso,
                rawDate: dateIso,
                particulars: `${custName} - ${service} (Application Fee)`,
                type: 'Receipt',
                amount: paid
              });
            }
          }
        });
      }
    } catch (e) {
      console.error("Error loading case fees for cashbook:", e);
    }

    // 2. Fetch receipts recorded via Billing / Receipts module
    try {
      const savedReceipts = localStorage.getItem('system_receipts');
      if (savedReceipts) {
        const parsed = JSON.parse(savedReceipts);
        parsed.forEach((r: any) => {
          // Avoid duplicate entry if already accounted for
          if (!combined.some(x => x.id === r.id)) {
            const dt = r.date ? new Date(r.date) : new Date();
            const dateIso = !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : todayStr;
            combined.push({
              id: r.id,
              date: dateIso,
              rawDate: dateIso,
              particulars: `${r.customer || 'Customer'} - ${r.services || 'Receipt'} (${r.mode || 'Cash'})`,
              type: 'Receipt',
              amount: Number(r.amount) || 0
            });
          }
        });
      }
    } catch (e) {
      console.error("Error loading receipts for cashbook:", e);
    }

    // 3. Fetch expenses recorded via Expenses module
    try {
      const savedExpenses = localStorage.getItem('system_expenses');
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        parsed.forEach((exp: any) => {
          const dt = exp.date ? new Date(exp.date) : new Date();
          const dateIso = !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : todayStr;
          combined.push({
            id: exp.id,
            date: dateIso,
            rawDate: dateIso,
            particulars: `${exp.category} - ${exp.description || 'Expense'} (${exp.mode || 'Cash'})`,
            type: 'Expense',
            amount: Number(exp.amount) || 0
          });
        });
      }
    } catch (e) {
      console.error("Error loading expenses for cashbook:", e);
    }

    // Sort transactions by date descending
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(combined);
    setLoading(false);
  };

  useEffect(() => {
    loadAllTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.particulars.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const isAfterFrom = !fromDate || t.date >= fromDate;
    const isBeforeTo = !toDate || t.date <= toDate;
    return matchesSearch && isAfterFrom && isBeforeTo;
  });

  const totalIn = filteredTransactions.filter(t => t.type === 'Receipt').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
  const closingBalance = openingBalance + totalIn - totalOut;

  let runningBalance = openingBalance;

  const handleExportExcel = () => {
    const headers = ['DATE', 'REF NO.', 'PARTICULARS', 'IN (RECEIPT)', 'OUT (EXPENSE)', 'BALANCE'];
    
    let currentBal = openingBalance;
    const rows = filteredTransactions.map(t => {
      if (t.type === 'Receipt') currentBal += t.amount;
      else currentBal -= t.amount;
      
      const receipt = t.type === 'Receipt' ? t.amount : '';
      const expense = t.type === 'Expense' ? t.amount : '';
      return `"${t.date}","${t.id}","${t.particulars}","${receipt}","${expense}","${currentBal}"`;
    });

    const csvContent = [
      headers.join(','),
      `"${fromDate}","-","Opening Balance","-","-","${openingBalance}"`,
      ...rows,
      `"","","CLOSING BALANCE","${totalIn}","${totalOut}","${closingBalance}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `CashBook_${fromDate}_to_${toDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Excel (CSV) exported successfully');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
          Cash Book & Balance
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>From:</span>
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>To:</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>
          <button className="btn-primary" onClick={handleExportExcel} style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981', borderColor: '#10b981' }}>
            <Download size={16} /> Export Excel
          </button>
          <button className="btn-primary" onClick={() => window.print()} style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Wallet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Opening Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>₹{openingBalance.toLocaleString()}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <ArrowDownRight size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Total Receipts (In)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>₹{totalIn.toLocaleString()}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Total Expenses (Out)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>₹{totalOut.toLocaleString()}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #0f172a' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Closing Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{closingBalance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>Ledger Transactions</h2>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', right: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search particulars..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ref No.</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Particulars</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>In (Receipt)</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Out (Expense)</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{fromDate}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>-</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Opening Balance</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>-</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', textAlign: 'right' }}>-</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)', textAlign: 'right' }}>₹{openingBalance.toLocaleString()}</td>
              </tr>

              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No transactions found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  if (t.type === 'Receipt') runningBalance += t.amount;
                  else runningBalance -= t.amount;

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.date}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{t.id}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.particulars}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#10b981', textAlign: 'right' }}>
                        {t.type === 'Receipt' ? `+ ₹${t.amount.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', textAlign: 'right' }}>
                        {t.type === 'Expense' ? `- ₹${t.amount.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)', textAlign: 'right' }}>
                        ₹{runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Closing Balance Row */}
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <td colSpan={3} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)', textAlign: 'right' }}>CLOSING BALANCE:</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#10b981', textAlign: 'right' }}>₹{totalIn.toLocaleString()}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>₹{totalOut.toLocaleString()}</td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)', textAlign: 'right' }}>₹{closingBalance.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashBook;
