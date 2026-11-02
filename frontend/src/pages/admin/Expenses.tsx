import React, { useState } from 'react';
import { 
  Search, Calendar, Plus, Eye, ShieldAlert, Check, X, 
  Printer, DollarSign, Clock, CheckCircle2, XCircle, RotateCcw, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const Expenses: React.FC = () => {
  const userRole = localStorage.getItem('userRole') || '';
  const loggedInUser = localStorage.getItem('loggedInUser') || '';
  const isStaff = userRole.toUpperCase() === 'STAFF' || (loggedInUser !== 'Admin' && loggedInUser !== '');

  // Default to 'add' so form is ready to use immediately without having to enable anything
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedExpenseForModal, setSelectedExpenseForModal] = useState<any | null>(null);

  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    'Office Supplies', 'Travel & Fuel', 'Site Inspection', 'Government & Municipal Fees', 
    'Marketing & Ads', 'Maintenance & Repairs', 'Refreshments', 'Other'
  ]);

  const [expenses, setExpenses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('system_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const generateNextVoucherNo = () => {
    return `EXP-${String(expenses.length + 1).padStart(3, '0')}`;
  };

  const initialFormState = {
    voucherNo: generateNextVoucherNo(),
    category: 'Office Supplies',
    description: '',
    status: isStaff ? 'Pending Admin Approval' : 'Approved',
    executive: isStaff ? (loggedInUser || 'Staff Member') : 'Admin User',
    expenseMode: 'Cash',
    expenseDate: new Date().toISOString().split('T')[0],
    expenseAmt: '',
    typeOfInst: 'None',
    instrNo: '',
    instrBankName: '',
    instrBankBranch: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  React.useEffect(() => {
    const savedCats = localStorage.getItem('expenseCategories');
    if (savedCats) {
      try {
        setExpenseCategories(JSON.parse(savedCats));
      } catch (e) {}
    }
  }, []);

  const generateExpenseHTML = (expense: any) => {
    return `
      <html>
        <head>
          <title>Expense Voucher - ${expense.id}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 40px;
              border: 1px solid #ddd;
            }
            @media print {
              .container { border: none; padding: 0; margin: 0; max-width: 100%; }
            }
            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .logo-img {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .company-info h1 {
              margin: 0 0 5px 0;
              font-size: 22px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .company-info p {
              margin: 2px 0;
              font-size: 12px;
              color: #444;
            }
            .receipt-meta {
              text-align: right;
            }
            .receipt-title {
              font-size: 26px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin: 0 0 15px 0;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: auto auto;
              gap: 8px 15px;
              text-align: left;
            }
            .meta-label {
              font-size: 11px;
              font-weight: bold;
              color: #666;
            }
            .meta-val {
              font-size: 12px;
              font-weight: bold;
            }
            .bill-to {
              margin-bottom: 25px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
            .bill-to h3 {
              margin: 0 0 8px 0;
              font-size: 13px;
              text-transform: uppercase;
              color: #555;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .amt-col {
              text-align: right;
            }
            .total-row td {
              font-weight: bold;
              font-size: 15px;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
            }
            .amount-words {
              font-size: 12px;
              margin-bottom: 40px;
              font-style: italic;
              color: #444;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .sig-block {
              text-align: center;
              width: 200px;
            }
            .sig-line {
              border-top: 1px solid #000;
              margin-bottom: 8px;
            }
            .sig-label {
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #888;
              border-top: 1px solid #eee;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-section">
                <img src="${window.location.origin}/assets/logo.jpeg" alt="Logo" class="logo-img" onerror="this.style.display='none'" />
                <div class="company-info">
                  <h1>C.B. BUILDING APPROVALS</h1>
                  <p>No. 45, Anna Salai, Chennai, Tamil Nadu - 600002</p>
                  <p>contact@cbapprovals.com | +91 98765 43210</p>
                </div>
              </div>
              <div class="receipt-meta">
                <div class="receipt-title">EXPENSE VOUCHER</div>
                <div class="meta-grid">
                  <div class="meta-label">Voucher No:</div>
                  <div class="meta-val">${expense.id}</div>
                  <div class="meta-label">Date:</div>
                  <div class="meta-val">${expense.date}</div>
                </div>
              </div>
            </div>

            <div class="bill-to">
              <h3>Expense Details</h3>
              <p style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">${expense.category}</p>
              <p style="margin: 2px 0;">Submitted By: <strong>${expense.executive || 'Staff'}</strong></p>
              <p style="margin: 2px 0;">Status: <strong>${expense.status}</strong></p>
              <p style="margin: 2px 0;">Payment Mode: <strong>${expense.mode}</strong></p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th>Description</th>
                  <th class="amt-col">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>${expense.description}</strong><br/>
                    <span style="font-size: 12px; color: #555;">Authorized Company Expense</span>
                  </td>
                  <td class="amt-col">₹${Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;">Total Amount</td>
                  <td class="amt-col">₹${Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div class="amount-words">
              * This expense voucher has been recorded in the company accounts system.
            </div>

            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Receiver / Claimed By</div>
              </div>
              <div class="sig-block">
                <div class="sig-line" style="display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; font-family: cursive; font-size: 20px;">C.B. Admin</div>
                <div class="sig-label">Authorized Signatory</div>
              </div>
            </div>
            
            <div class="footer">
              This is a computer-generated expense voucher.<br/>
              Generated on ${new Date().toLocaleString('en-IN')}
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
  };

  const handlePrintExpense = (expense: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateExpenseHTML(expense));
      printWindow.document.close();
    }
  };

  const handleApproveExpense = (expId: string) => {
    const updated = expenses.map(e => e.id === expId ? { ...e, status: 'Approved' } : e);
    setExpenses(updated);
    localStorage.setItem('system_expenses', JSON.stringify(updated));
    toast.success(`Expense ${expId} approved!`);
  };

  const handleRejectExpense = (expId: string) => {
    const updated = expenses.map(e => e.id === expId ? { ...e, status: 'Rejected' } : e);
    setExpenses(updated);
    localStorage.setItem('system_expenses', JSON.stringify(updated));
    toast.error(`Expense ${expId} rejected.`);
  };

  const handleSubmitExpense = (e: React.FormEvent, shouldPrint: boolean = true) => {
    e.preventDefault();
    if (!formData.category || formData.category === '<Select>') {
      toast.error('Please select an Expense Category.');
      return;
    }
    if (!formData.expenseAmt || Number(formData.expenseAmt) <= 0) {
      toast.error('Please enter a valid Expense Amount.');
      return;
    }

    const finalDescription = formData.description?.trim()
      ? formData.description.trim()
      : `${formData.category} expense`;

    const newExpense = {
      id: formData.voucherNo || generateNextVoucherNo(),
      date: formData.expenseDate,
      category: formData.category,
      description: finalDescription,
      amount: Number(formData.expenseAmt),
      mode: formData.expenseMode,
      status: isStaff ? 'Pending Admin Approval' : 'Approved',
      executive: isStaff ? (loggedInUser || 'Staff Member') : 'Admin User',
      createdByStaff: isStaff,
      instrNo: formData.instrNo,
      instrBankName: formData.instrBankName
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    try {
      localStorage.setItem('system_expenses', JSON.stringify(updatedExpenses));
    } catch (err) {
      console.error(err);
    }

    if (isStaff) {
      toast.success('Expense recorded and submitted for Admin Approval!');
    } else {
      toast.success('Expense recorded successfully!');
    }

    if (shouldPrint) {
      handlePrintExpense(newExpense);
    }

    // Reset form and regenerate next voucher number
    setFormData({
      ...initialFormState,
      voucherNo: `EXP-${String(updatedExpenses.length + 1).padStart(3, '0')}`
    });
  };

  const handleClear = () => {
    setFormData({
      ...initialFormState,
      voucherNo: generateNextVoucherNo()
    });
  };

  // Filtered expenses for View tab
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      (exp.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.executive || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalExpenseAmount = expenses
    .filter(e => e.status === 'Approved')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const pendingApprovalExpenses = expenses.filter(e => e.status === 'Pending Admin Approval');

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Staff Notice */}
      {isStaff && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderLeft: '4px solid #2563eb',
          borderRadius: '0.5rem',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#1e3a8a',
          fontSize: '0.875rem'
        }}>
          <ShieldAlert size={20} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <strong>Staff Expense Portal:</strong> Expenses recorded by staff will enter <em>Pending Admin Approval</em> and will only be calculated in official cash book / accounts after Admin verification.
          </div>
        </div>
      )}

      {/* Admin Pending Banner */}
      {!isStaff && pendingApprovalExpenses.length > 0 && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} color="#d97706" />
            <div>
              <span style={{ fontWeight: 700, color: '#92400e' }}>{pendingApprovalExpenses.length} Staff Expense(s) Awaiting Your Approval</span>
              <div style={{ fontSize: '0.8rem', color: '#b45309' }}>Review and approve them in the View tab below.</div>
            </div>
          </div>
          <button
            onClick={() => { setActiveTab('view'); setStatusFilter('Pending Admin Approval'); }}
            style={{
              padding: '0.4rem 0.85rem',
              backgroundColor: '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Review Now
          </button>
        </div>
      )}

      {/* Top Header & Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
            Expenses Management
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Record company expenses, generate vouchers, and track approvals seamlessly.
          </p>
        </div>

        {/* User-friendly Toggle Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: activeTab === 'add' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'add' ? '#fff' : '#475569',
              boxShadow: activeTab === 'add' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} /> Record Expense
          </button>

          <button
            onClick={() => setActiveTab('view')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: activeTab === 'view' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'view' ? '#fff' : '#475569',
              boxShadow: activeTab === 'view' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={16} /> View All Expenses ({expenses.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ADD / RECORD EXPENSE */}
      {activeTab === 'add' && (
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                New Expense Voucher Form
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Fill in the details below. Voucher number is generated automatically.
              </span>
            </div>
            <span style={{ padding: '0.35rem 0.75rem', backgroundColor: '#e2e8f0', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
              Voucher #{formData.voucherNo}
            </span>
          </div>

          <form onSubmit={(e) => handleSubmitExpense(e, true)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Expense Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                  required
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Expense Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.expenseAmt}
                    onChange={(e) => setFormData({ ...formData, expenseAmt: e.target.value })}
                    placeholder="Enter amount (e.g. 1500)"
                    style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem', fontWeight: 600 }}
                    required
                  />
                  <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>₹</span>
                </div>
              </div>

              {/* Expense Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Expense Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                  required
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Payment Mode <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.expenseMode}
                  onChange={(e) => setFormData({ ...formData, expenseMode: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Executive / Staff */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Recorded By / Executive
                </label>
                <input
                  type="text"
                  value={formData.executive}
                  readOnly
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.875rem', color: '#64748b' }}
                />
              </div>

              {/* Initial Approval Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Approval Status
                </label>
                <input
                  type="text"
                  value={formData.status}
                  readOnly
                  style={{ 
                    width: '100%', 
                    padding: '0.65rem', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)', 
                    backgroundColor: formData.status === 'Approved' ? '#ecfdf5' : '#fffbeb', 
                    color: formData.status === 'Approved' ? '#047857' : '#b45309',
                    fontSize: '0.875rem', 
                    fontWeight: 600 
                  }}
                />
              </div>

              {/* Full Width Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Description / Purpose of Expense
                </label>
                <input
                  type="text"
                  placeholder="e.g. Site visit inspection fuel, print cartridges, tea and refreshments..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                />
              </div>

              {/* Optional Bank / Cheque Details if Non-Cash */}
              {formData.expenseMode !== 'Cash' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      Ref / Cheque / UTR No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CHQ-893041 / UPI-4928"
                      value={formData.instrNo}
                      onChange={(e) => setFormData({ ...formData, instrNo: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC / SBI"
                      value={formData.instrBankName}
                      onChange={(e) => setFormData({ ...formData, instrBankName: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                    />
                  </div>
                </>
              )}

            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Printer size={18} /> Save & Print Voucher
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmitExpense(e, false)}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.25rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Save Only
                </button>
              </div>

              <button
                type="button"
                onClick={handleClear}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.75rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <RotateCcw size={15} /> Reset Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: VIEW ALL EXPENSES */}
      {activeTab === 'view' && (
        <div>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Approved Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.35rem' }}>
                ₹{totalExpenseAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>Count: {expenses.filter(e => e.status === 'Approved').length}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Awaiting Approval</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginTop: '0.35rem' }}>
                {pendingApprovalExpenses.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>Staff submissions</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Records</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#334155', marginTop: '0.35rem' }}>
                {expenses.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>All recorded vouchers</div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by Voucher No, Category, Description, Staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Admin Approval">Pending Admin Approval</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="ALL">All Categories</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expenses Data Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Voucher No</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Category</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Description</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mode</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Submitted By</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Amount</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No expense records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {exp.id}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                          {exp.date}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                          {exp.category}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={exp.description}>
                          {exp.description || '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#475569', fontWeight: 500 }}>
                            {exp.mode}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                          {exp.executive || 'Staff'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: exp.status === 'Approved' ? '#ecfdf5' : exp.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                            color: exp.status === 'Approved' ? '#047857' : exp.status === 'Rejected' ? '#b91c1c' : '#b45309'
                          }}>
                            {exp.status === 'Approved' && <CheckCircle2 size={12} />}
                            {exp.status === 'Rejected' && <XCircle size={12} />}
                            {exp.status === 'Pending Admin Approval' && <Clock size={12} />}
                            {exp.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              onClick={() => handlePrintExpense(exp)}
                              title="Print / View Voucher"
                              style={{
                                padding: '0.4rem 0.65rem',
                                backgroundColor: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Printer size={14} /> Print
                            </button>

                            {/* Admin Approve & Reject Buttons */}
                            {!isStaff && exp.status === 'Pending Admin Approval' && (
                              <>
                                <button
                                  onClick={() => handleApproveExpense(exp.id)}
                                  title="Approve Expense"
                                  style={{
                                    padding: '0.4rem 0.6rem',
                                    backgroundColor: '#16a34a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleRejectExpense(exp.id)}
                                  title="Reject Expense"
                                  style={{
                                    padding: '0.4rem 0.6rem',
                                    backgroundColor: '#dc2626',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
