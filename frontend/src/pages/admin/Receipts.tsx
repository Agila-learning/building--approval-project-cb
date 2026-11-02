import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Plus, Eye, Printer, RotateCcw, 
  CheckCircle2, DollarSign, User, Phone, FileText, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const Receipts: React.FC = () => {
  const loggedInUser = localStorage.getItem('loggedInUser') || 'Admin User';

  // Default to 'add' so form is ready to use immediately without having to enable anything
  const [activeTab, setActiveTab] = useState<'add' | 'view'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  const [loadingCases, setLoadingCases] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [selectedCaseRaw, setSelectedCaseRaw] = useState<any>(null);

  const [receipts, setReceipts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('system_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const generateNextReceiptId = () => {
    return `REC-${String(receipts.length + 1).padStart(3, '0')}`;
  };

  const initialFormState = {
    receiptId: generateNextReceiptId(),
    type: 'Existing',
    services: 'Building Plan Approval',
    applicationNo: '',
    customerName: '',
    mobileNumber: '',
    executive: loggedInUser || 'Admin User',
    receiptMode: 'UPI',
    receiptDate: new Date().toISOString().split('T')[0],
    receiptAmt: '',
    balance: '₹0',
    instrNo: '',
    instrBankName: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch real cases from backend API & local storage
  const fetchPendingCases = async () => {
    setLoadingCases(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/cases`);
      let cases: any[] = [];
      if (res.ok) {
        cases = await res.json();
      }

      const localStr = localStorage.getItem('mock_saved_cases');
      if (localStr) {
        try {
          const locals = JSON.parse(localStr);
          cases = [...cases, ...locals];
        } catch (e) {}
      }

      const allList: any[] = [];
      const pendingList: any[] = [];

      cases.forEach((c: any) => {
        const total = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
        const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
        const pending = c.fees?.pending !== undefined && c.fees?.pending !== null ? Number(c.fees.pending) : Math.max(0, total - paid);

        const item = {
          rawCase: c,
          mongoId: c.id || c._id,
          appNo: c.application_number || c.id || c._id,
          customer: c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer',
          mobile: c.property?.owner_phone || c.fullData?.mobile || c.mobile || '',
          service: c.approval_type || c.type || 'Building Plan Approval',
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          executive: c.assigned_staff?.name || c.fullData?.staff || 'Admin User'
        };

        allList.push(item);
        if (pending > 0) {
          pendingList.push(item);
        }
      });

      setAllApplications(allList);
      setPendingApplications(pendingList);
    } catch (err) {
      console.error("Failed to fetch pending applications:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchPendingCases();
  }, []);

  const autoFillFromApplication = (app: any) => {
    if (!app) return;
    const raw = app.rawCase || app;
    setSelectedCaseRaw(raw);

    const pendingAmt = app.pendingAmount !== undefined ? app.pendingAmount : Math.max(0, (app.totalAmount || 0) - (app.paidAmount || 0));

    setFormData(prev => ({
      ...prev,
      type: 'Existing',
      applicationNo: app.appNo,
      customerName: app.customer,
      mobileNumber: app.mobile,
      services: app.service || prev.services,
      balance: pendingAmt > 0 ? `₹${pendingAmt.toLocaleString('en-IN')}` : '₹0',
      receiptAmt: pendingAmt > 0 ? pendingAmt.toString() : prev.receiptAmt,
      executive: app.executive || prev.executive || loggedInUser || 'Admin User'
    }));

    toast.success(`Auto-fetched details for ${app.customer} (${app.appNo})`, { id: 'autofill-toast' });
  };

  const handleAppNoChange = (val: string) => {
    setFormData(prev => ({ ...prev, applicationNo: val }));
    const trimmed = val.trim();
    if (!trimmed) return;
    const match = allApplications.find(a => 
      a.appNo.toLowerCase() === trimmed.toLowerCase() ||
      a.appNo.toLowerCase().replace(/[^a-z0-9]/gi, '') === trimmed.toLowerCase().replace(/[^a-z0-9]/gi, '')
    );
    if (match) {
      autoFillFromApplication(match);
    }
  };

  const handleCustomerChange = (val: string) => {
    setFormData(prev => ({ ...prev, customerName: val }));
    const trimmed = val.trim();
    if (trimmed.length < 2) return;
    const match = allApplications.find(a => 
      a.customer.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      autoFillFromApplication(match);
    }
  };

  const handleMobileChange = (val: string) => {
    setFormData(prev => ({ ...prev, mobileNumber: val }));
    const clean = val.replace(/\D/g, '');
    if (clean.length < 10) return;
    const match = allApplications.find(a => 
      (a.mobile || '').replace(/\D/g, '').endsWith(clean)
    );
    if (match) {
      autoFillFromApplication(match);
    }
  };

  const handleConfirm = async (e: React.FormEvent, shouldPrint: boolean = true) => {
    e.preventDefault();
    if (!formData.receiptAmt || Number(formData.receiptAmt) <= 0) {
      toast.error('Please enter a valid receipt amount.');
      return;
    }

    const receiptAmountNum = Number(formData.receiptAmt) || 0;
    const receipt = {
      id: formData.receiptId || generateNextReceiptId(),
      date: formData.receiptDate ? new Date(formData.receiptDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      customer: formData.customerName || 'Customer',
      mobile: formData.mobileNumber,
      amount: receiptAmountNum,
      mode: formData.receiptMode,
      status: 'Confirmed',
      applicationNo: formData.applicationNo || 'N/A',
      services: formData.services,
      executive: formData.executive,
      notes: formData.notes,
      instrNo: formData.instrNo,
      instrBankName: formData.instrBankName
    };

    const updatedReceipts = [receipt, ...receipts];
    setReceipts(updatedReceipts);
    try {
      localStorage.setItem('system_receipts', JSON.stringify(updatedReceipts));
    } catch (e) {
      console.error(e);
    }

    // If linked to an existing case, update the fee collection in MongoDB
    if (selectedCaseRaw && receiptAmountNum > 0) {
      try {
        const apiUrl = getApiUrl();
        const targetId = selectedCaseRaw.id || selectedCaseRaw._id;
        const total = Number(selectedCaseRaw.fees?.total ?? selectedCaseRaw.fullData?.fees?.total ?? (selectedCaseRaw.fullData?.feesAmount ? parseFloat(selectedCaseRaw.fullData.feesAmount) : 0)) || 0;
        const prevPaid = Number(selectedCaseRaw.fees?.paid ?? selectedCaseRaw.fullData?.fees?.paid ?? (selectedCaseRaw.fullData?.paidAmount ? parseFloat(selectedCaseRaw.fullData.paidAmount) : 0)) || 0;
        const newPaid = prevPaid + receiptAmountNum;
        const newPending = Math.max(0, total - newPaid);

        const existingCharges = selectedCaseRaw.fees?.charges || selectedCaseRaw.fullData?.fees?.charges || [];
        const updatedCharges = [...existingCharges, {
          id: receipt.id,
          description: `Receipt ${receipt.id} via ${formData.receiptMode}`,
          amount: receiptAmountNum,
          mode: formData.receiptMode,
          date: new Date().toISOString()
        }];

        const updatedFees = {
          total,
          paid: newPaid,
          pending: newPending,
          notes: selectedCaseRaw.fees?.notes || '',
          charges: updatedCharges
        };

        await fetch(`${apiUrl}/cases/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fees: updatedFees,
            fullData: {
              ...(selectedCaseRaw.fullData || {}),
              feesAmount: total.toString(),
              paidAmount: newPaid.toString(),
              fees: updatedFees
            }
          })
        });

        fetchPendingCases();
      } catch (err) {
        console.error("Failed to update case payment on server:", err);
      }
    }

    toast.success('Payment recorded successfully!');

    if (shouldPrint) {
      sessionStorage.setItem('print_receipt_data', JSON.stringify(receipt));
      window.open(`/print/receipt/${receipt.id}`, '_blank');
    }

    // Reset form and prepare next receipt ID
    setSelectedCaseRaw(null);
    setFormData({
      ...initialFormState,
      receiptId: `REC-${String(updatedReceipts.length + 1).padStart(3, '0')}`
    });
  };

  const handlePrintReceipt = (receipt: any) => {
    sessionStorage.setItem('print_receipt_data', JSON.stringify(receipt));
    window.open(`/print/receipt/${receipt.id}`, '_blank');
  };

  const handleClear = () => {
    setSelectedCaseRaw(null);
    setFormData({
      ...initialFormState,
      receiptId: generateNextReceiptId()
    });
  };

  // Filtered receipts for View tab
  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = 
      (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.applicationNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.mobile || '').includes(searchTerm);

    const matchesMode = modeFilter === 'ALL' || r.mode === modeFilter;

    return matchesSearch && matchesMode;
  });

  const totalCollectedAmount = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* HTML5 Datalists for instant auto-complete suggestions */}
      <datalist id="appsDatalist">
        {allApplications.map((a, i) => (
          <option key={`app-${i}`} value={a.appNo}>{a.customer} - ₹{a.pendingAmount} Pending</option>
        ))}
      </datalist>

      <datalist id="customersDatalist">
        {allApplications.map((a, i) => (
          <option key={`cust-${i}`} value={a.customer}>{a.appNo} ({a.mobile})</option>
        ))}
      </datalist>

      <datalist id="mobilesDatalist">
        {allApplications.map((a, i) => (
          <option key={`mob-${i}`} value={a.mobile}>{a.customer} ({a.appNo})</option>
        ))}
      </datalist>

      {/* Top Header & Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
            Billing & Receipts
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Raise payment receipts for client applications and view all historical billing transactions.
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
            <Plus size={16} /> Raise New Receipt
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
            <Eye size={16} /> View All Receipts ({receipts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: RAISE NEW RECEIPT */}
      {activeTab === 'add' && (
        <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          
          {/* Quick Case Selection Box */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                <Search size={18} color="var(--primary)" />
                Quick Auto-Fetch from Pending Applications ({pendingApplications.length})
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Selecting a case automatically populates all client details & outstanding fee
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <select
                onChange={(e) => {
                  const selected = pendingApplications.find(p => p.appNo === e.target.value);
                  if (selected) autoFillFromApplication(selected);
                }}
                defaultValue=""
                style={{ flex: '1 1 300px', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
              >
                <option value="" disabled>-- Select an Application with Pending Balance --</option>
                {pendingApplications.map(app => (
                  <option key={app.appNo} value={app.appNo}>
                    {app.appNo} — {app.customer} (Pending: ₹{app.pendingAmount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>

              {formData.applicationNo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Selected: {formData.applicationNo} ({formData.customerName})
                </div>
              )}
            </div>
          </div>

          <form onSubmit={(e) => handleConfirm(e, true)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* Application No */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Application Number
                </label>
                <input
                  list="appsDatalist"
                  type="text"
                  placeholder="e.g. APP-1001"
                  value={formData.applicationNo}
                  onChange={(e) => handleAppNoChange(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                />
              </div>

              {/* Customer Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Customer Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  list="customersDatalist"
                  type="text"
                  placeholder="Type or select customer name"
                  value={formData.customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                  required
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Mobile Number
                </label>
                <input
                  list="mobilesDatalist"
                  type="text"
                  placeholder="Enter 10-digit mobile"
                  value={formData.mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                />
              </div>

              {/* Service / Approval Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Service / Plan Type
                </label>
                <select
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                >
                  <option value="Building Plan Approval">Building Plan Approval</option>
                  <option value="Layout Approval (DTCP / CMDA)">Layout Approval (DTCP / CMDA)</option>
                  <option value="Structural Stability & NOC">Structural Stability & NOC</option>
                  <option value="Regularization Scheme">Regularization Scheme</option>
                  <option value="Consultancy & Estimation">Consultancy & Estimation</option>
                </select>
              </div>

              {/* Outstanding Balance */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Outstanding Balance
                </label>
                <input
                  type="text"
                  value={formData.balance}
                  readOnly
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.875rem', fontWeight: 700, color: '#dc2626' }}
                />
              </div>

              {/* Receipt Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Amount Received (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Enter amount collected..."
                    value={formData.receiptAmt}
                    onChange={(e) => setFormData({ ...formData, receiptAmt: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.65rem 0.65rem 2rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}
                    required
                  />
                  <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600 }}>₹</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Payment Mode <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.receiptMode}
                  onChange={(e) => setFormData({ ...formData, receiptMode: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                >
                  <option value="UPI">UPI / QR Code / GPay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Receipt Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Receipt Date
                </label>
                <input
                  type="date"
                  value={formData.receiptDate}
                  onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#fff', fontSize: '0.875rem' }}
                />
              </div>

              {/* Executive / Staff */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  Collected By / Executive
                </label>
                <input
                  type="text"
                  value={formData.executive}
                  readOnly
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '0.875rem', color: '#64748b' }}
                />
              </div>

              {/* Non-Cash Details */}
              {formData.receiptMode !== 'Cash' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      UTR / Transaction / Cheque No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-9830491823"
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
                  <Printer size={18} /> Confirm & Print Receipt
                </button>

                <button
                  type="button"
                  onClick={(e) => handleConfirm(e, false)}
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
                  Save Receipt Only
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

      {/* TAB 2: VIEW ALL RECEIPTS */}
      {activeTab === 'view' && (
        <div>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Collections</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.35rem' }}>
                ₹{totalCollectedAmount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>Total Receipts Issued: {receipts.length}</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pending Applications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginTop: '0.35rem' }}>
                {pendingApplications.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>Awaiting full payment</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Cases Registered</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#334155', marginTop: '0.35rem' }}>
                {allApplications.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>In system records</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by Receipt No, Customer, App No, Mobile..."
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
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  style={{ padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#fff' }}
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          {/* Receipts Data Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Receipt No</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>App No</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Customer</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Service</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mode</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Amount Paid</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No billing receipts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {rec.id}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                          {rec.date}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#1e293b', fontWeight: 600 }}>
                            {rec.applicationNo || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                          <div>{rec.customer}</div>
                          {rec.mobile && <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{rec.mobile}</div>}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                          {rec.services || 'Building Plan Approval'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#475569', fontWeight: 500 }}>
                            {rec.mode || 'Cash'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                          ₹{Number(rec.amount).toLocaleString('en-IN')}
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
                            backgroundColor: '#ecfdf5',
                            color: '#047857'
                          }}>
                            <CheckCircle2 size={12} /> {rec.status || 'Confirmed'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handlePrintReceipt(rec)}
                            title="Print / View Receipt"
                            style={{
                              padding: '0.4rem 0.75rem',
                              backgroundColor: 'var(--primary)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Printer size={14} /> Print Receipt
                          </button>
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

export default Receipts;
