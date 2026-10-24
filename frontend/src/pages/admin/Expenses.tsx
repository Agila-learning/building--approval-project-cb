import React, { useState } from 'react';
import { Search, Calendar, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DenseField = ({ label, type = 'text', value, onChange, icon, options, readOnly, disabled, extraIcon, onIconClick, placeholder, required }: any) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
      <div style={{ width: '160px', flexShrink: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: readOnly || disabled ? 'var(--bg-secondary)' : 'white', height: '32px', position: 'relative' }}>
        {options ? (
          <select value={value} onChange={onChange} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', padding: '0 8px', height: '100%', color: 'inherit' }} disabled={disabled}>
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value} onChange={onChange} readOnly={readOnly} disabled={disabled} placeholder={placeholder} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', padding: '0 8px', height: '100%', color: 'inherit' }} />
        )}
        {icon && (
          <div onClick={onIconClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', cursor: onIconClick ? 'pointer' : 'default', borderLeft: '1px solid var(--border-color)', height: '100%', color: 'var(--primary)' }}>
            {icon}
          </div>
        )}
      </div>
      {extraIcon && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          {extraIcon}
        </div>
      )}
    </div>
  );
};

const Expenses: React.FC = () => {
  const [view, setView] = useState<'view' | 'add' | 'disabled'>('disabled');
  const [isExpenseSearchModalOpen, setIsExpenseSearchModalOpen] = useState(false);

  const initialFormState = {
    category: '<Select>',
    referenceNo: '',
    description: '',
    status: 'Pending',
    executive: 'Admin User',
    expenseMode: 'Select',
    expenseDate: new Date().toISOString().split('T')[0],
    expenseAmt: '',
    typeOfInst: 'Select', instrNo: '', instrAmount: '', instrDate: '',
    instrBankName: '', instrBankBranch: '', payableAt: '',
    thirdPartyRemittance: 'Select', instrBnkAccHoldName: '', instrBnkAccNo: '', glCode: ''
  };

  const [expenses, setExpenses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('system_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [formData, setFormData] = useState(initialFormState);

  const [expenseCategories, setExpenseCategories] = useState<string[]>(['Office Supplies', 'Travel', 'Marketing', 'Maintenance', 'Other']);

  React.useEffect(() => {
    const savedCats = localStorage.getItem('expenseCategories');
    if (savedCats) {
      setExpenseCategories(JSON.parse(savedCats));
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
              text-transform: uppercase;
            }
            .meta-val {
              font-size: 13px;
              font-weight: bold;
            }
            .bill-to {
              margin-bottom: 30px;
              padding: 20px;
              background: #f9f9f9;
              border-left: 4px solid #000;
            }
            .bill-to h3 {
              margin: 0 0 12px 0;
              font-size: 13px;
              text-transform: uppercase;
              color: #555;
            }
            .bill-to p {
              margin: 6px 0;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #eee;
              text-align: left;
              padding: 12px;
              font-size: 12px;
              text-transform: uppercase;
              border-bottom: 2px solid #000;
              border-top: 2px solid #000;
            }
            td {
              padding: 15px 12px;
              border-bottom: 1px solid #ccc;
              font-size: 14px;
            }
            .amt-col {
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              font-size: 16px;
            }
            .total-row td {
              border-bottom: 2px solid #000;
              padding-top: 20px;
            }
            .amount-words {
              font-size: 12px;
              font-style: italic;
              color: #555;
              margin-bottom: 60px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .sig-block {
              text-align: center;
              width: 250px;
            }
            .sig-line {
              border-bottom: 1px solid #000;
              height: 40px;
              margin-bottom: 8px;
            }
            .sig-label {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 50px;
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
                <img src="\${window.location.origin}/assets/logo.jpeg" alt="Logo" class="logo-img" onerror="this.style.display='none'" />
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
              <p style="font-size: 18px; font-weight: bold;">${expense.category}</p>
              <p>Status: <strong>${expense.status}</strong></p>
              <p>Payment Mode: <strong>${expense.mode}</strong></p>
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
                  <td class="amt-col">${Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="text-align: right;">Total Amount</td>
                  <td class="amt-col">₹${Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div class="amount-words">
              * This expense has been reviewed and recorded by administration.
            </div>

            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Receiver's Signature</div>
              </div>
              <div class="sig-block">
                <div class="sig-line" style="display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; font-family: cursive; font-size: 20px;">C.B. Admin</div>
                <div class="sig-label">Authorized Signatory</div>
              </div>
            </div>
            
            <div class="footer">
              This is a computer-generated expense voucher.<br/>
              Generated by: System
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

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || formData.category === '<Select>') {
      toast.error('Please select an Expense Category.');
      return;
    }
    if (!formData.expenseAmt || Number(formData.expenseAmt) <= 0) {
      toast.error('Please enter a valid Expense Amount.');
      return;
    }

    // Auto-fill description if left blank by user
    const finalDescription = formData.description?.trim()
      ? formData.description.trim()
      : `${formData.category} expense`;

    const newExpense = {
      id: `EXP-00${expenses.length + 1}`,
      date: formData.expenseDate,
      category: formData.category,
      description: finalDescription,
      amount: Number(formData.expenseAmt),
      mode: formData.expenseMode === 'Select' ? 'Cash' : formData.expenseMode,
      status: 'Pending'
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    try {
      localStorage.setItem('system_expenses', JSON.stringify(updatedExpenses));
    } catch (err) {
      console.error(err);
    }

    toast.success('Expense recorded successfully!');
    setView('disabled');
    setFormData(initialFormState);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateExpenseHTML(newExpense));
      printWindow.document.close();
    }
  };

  const handleReprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referenceNo) {
      toast.error('Please select an expense to reprint.');
      return;
    }

    const expense = {
      id: formData.referenceNo,
      date: formData.expenseDate,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.expenseAmt),
      mode: formData.expenseMode,
      status: formData.status
    };

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateExpenseHTML(expense));
      printWindow.document.close();
    }
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    setView('disabled');
    setFormData(initialFormState);
  };

  const handleClear = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData(initialFormState);
  };

  // Form disable logic
  const isFormDisabled = view === 'disabled' || view === 'view';
  const isBottomHalfDisabled = isFormDisabled || formData.expenseMode === 'Cash';
  const isRefNoSearchEnabled = view === 'view';

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
          {view === 'view' ? 'View/Reprint Expense' : 'Record an Expense'}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn-primary ${view === 'add' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: view === 'add' ? 'var(--primary-dark)' : 'var(--primary)' }}
            onClick={() => { setView('add'); setFormData(initialFormState); }}
          >
            <Plus size={16} /> Add
          </button>
          <button
            className={`btn-primary ${view === 'view' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: view === 'view' ? 'var(--primary-dark)' : 'var(--primary)' }}
            onClick={() => { setView('view'); setFormData(initialFormState); }}
          >
            <Eye size={16} /> View
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem 1rem' }}>

            <DenseField label="Category" value={formData.category} onChange={(e: any) => setFormData({ ...formData, category: e.target.value })} options={['<Select>', ...expenseCategories]} disabled={isFormDisabled} required={true} />
            <DenseField label="Description" value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} disabled={isFormDisabled} placeholder="E.g. Stationery, site visit..." />
            <DenseField label="Reference No." value={formData.referenceNo} readOnly={true} disabled={!isRefNoSearchEnabled} icon={isRefNoSearchEnabled ? <Search size={14} /> : null} onIconClick={() => isRefNoSearchEnabled && setIsExpenseSearchModalOpen(true)} />
            <DenseField label="Executive" value={formData.executive} readOnly={true} disabled={true} />

            <DenseField label="Status" value={formData.status} readOnly={true} disabled={true} />
            <DenseField label="Expense Mode" value={formData.expenseMode} onChange={(e: any) => setFormData({ ...formData, expenseMode: e.target.value })} options={['Select', 'Cash', 'Bank', 'UPI']} disabled={isFormDisabled} />
            <DenseField label="Expense Date" value={formData.expenseDate} readOnly={true} disabled={true} icon={<Calendar size={14} />} />
            <DenseField label="Expense Amt." value={formData.expenseAmt} onChange={(e: any) => setFormData({ ...formData, expenseAmt: e.target.value })} disabled={isFormDisabled} type="number" required={true} placeholder="Enter amount..." />

          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }}></div>

        <div style={{ marginBottom: '1.5rem', opacity: isBottomHalfDisabled ? 0.5 : 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem 1rem' }}>

            <DenseField label="Type of Inst." value={formData.typeOfInst} onChange={(e: any) => setFormData({ ...formData, typeOfInst: e.target.value })} options={['Select', 'Type A', 'Type B']} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr.No" value={formData.instrNo} onChange={(e: any) => setFormData({ ...formData, instrNo: e.target.value })} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr. Amount" value={formData.instrAmount} onChange={(e: any) => setFormData({ ...formData, instrAmount: e.target.value })} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr. Date" value={formData.instrDate} onChange={(e: any) => setFormData({ ...formData, instrDate: e.target.value })} icon={<Calendar size={14} />} disabled={isBottomHalfDisabled} />

            <DenseField label="Instr. Bank Name" value={formData.instrBankName} onChange={(e: any) => setFormData({ ...formData, instrBankName: e.target.value })} icon={<Search size={14} />} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr. Bank Branch" value={formData.instrBankBranch} onChange={(e: any) => setFormData({ ...formData, instrBankBranch: e.target.value })} disabled={isBottomHalfDisabled} />
            <DenseField label="Payable At" value={formData.payableAt} onChange={(e: any) => setFormData({ ...formData, payableAt: e.target.value })} disabled={isBottomHalfDisabled} />

            <DenseField label="Third Party Remittance" value={formData.thirdPartyRemittance} onChange={(e: any) => setFormData({ ...formData, thirdPartyRemittance: e.target.value })} options={['Select', 'Yes', 'No']} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr.Bnk.Acc Hold Name" value={formData.instrBnkAccHoldName} onChange={(e: any) => setFormData({ ...formData, instrBnkAccHoldName: e.target.value })} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr.Bnk.Acc.No" value={formData.instrBnkAccNo} onChange={(e: any) => setFormData({ ...formData, instrBnkAccNo: e.target.value })} disabled={isBottomHalfDisabled} />
            <DenseField label="Gl.code" value={formData.glCode} onChange={(e: any) => setFormData({ ...formData, glCode: e.target.value })} icon={<Search size={14} />} disabled={isBottomHalfDisabled} />
            <div></div>
          </div>
        </div>

        {view === 'add' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleConfirm} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '8px 24px', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CONFIRM</button>
              <button onClick={handleCancel} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 24px', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CANCEL</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleClear} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '8px 24px', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>CLEAR</button>
            </div>
          </div>
        )}

        {view === 'view' && formData.referenceNo && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={handleReprint} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '8px 32px', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>REPRINT VOUCHER</button>
          </div>
        )}
      </div>

      {isExpenseSearchModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Select Expense to View/Reprint</h3>
              <button onClick={() => setIsExpenseSearchModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Voucher No.</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{exp.id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{exp.category}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{exp.date}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{exp.amount.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          onClick={() => {
                            setFormData({
                              ...initialFormState,
                              referenceNo: exp.id,
                              category: exp.category,
                              description: exp.description,
                              expenseDate: exp.date,
                              expenseAmt: exp.amount.toString(),
                              expenseMode: exp.mode,
                              status: exp.status
                            });
                            setIsExpenseSearchModalOpen(false);
                          }}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
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
