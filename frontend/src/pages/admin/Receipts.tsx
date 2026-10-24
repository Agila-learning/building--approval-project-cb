import React, { useState } from 'react';
import { Search, Calendar, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DenseField = ({ label, type = 'text', value, onChange, icon, options, readOnly, disabled, extraIcon, onIconClick }: any) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
      <div style={{ width: '160px', flexShrink: 0, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: readOnly || disabled ? 'var(--bg-secondary)' : 'white', height: '32px', position: 'relative' }}>
        {options ? (
          <select value={value} onChange={onChange} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', padding: '0 8px', height: '100%', color: 'inherit' }} disabled={disabled}>
            {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value} onChange={onChange} readOnly={readOnly} disabled={disabled} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', padding: '0 8px', height: '100%', color: 'inherit' }} />
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

const Receipts: React.FC = () => {
  const [view, setView] = useState<'view' | 'add' | 'disabled'>('disabled');
  const [isAppSearchModalOpen, setIsAppSearchModalOpen] = useState(false);
  const [isReceiptSearchModalOpen, setIsReceiptSearchModalOpen] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [selectedCaseRaw, setSelectedCaseRaw] = useState<any>(null);

  const initialFormState = {
    type: 'Fresh', services: '<Select>', applicationNo: '',
    referenceNo: '', customerName: '', mobileNumber: '',
    executive: 'Admin User',
    receiptMode: 'Select', receiptDate: new Date().toISOString().split('T')[0],
    receiptAmt: '', balance: '',
    typeOfInst: 'Select', instrNo: '', instrAmount: '', instrDate: '',
    instrBankName: '', instrBankBranch: '', payableAt: '', payInSlipType: '',
    thirdPartyRemittance: 'Select', instrBnkAccHoldName: '', instrBnkAccNo: '', glCode: '',
    remittedBy: '', printCount: ''
  };

  const [receipts, setReceipts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('system_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [formData, setFormData] = useState(initialFormState);

  // Fetch real cases from backend API
  const fetchPendingCases = async () => {
    setLoadingCases(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
      const res = await fetch(`${apiUrl}/cases`);
      if (res.ok) {
        const cases = await res.json();
        const pendingList: any[] = [];
        cases.forEach((c: any) => {
          const total = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
          const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
          const pending = c.fees?.pending !== undefined && c.fees?.pending !== null ? Number(c.fees.pending) : Math.max(0, total - paid);

          // Only show cases that have a pending balance
          if (pending > 0) {
            pendingList.push({
              rawCase: c,
              mongoId: c.id,
              appNo: c.application_number || c.id,
              customer: c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer',
              mobile: c.property?.owner_phone || c.fullData?.mobile || c.mobile || '',
              service: c.approval_type || c.type || 'Building Plan Approval',
              totalAmount: total,
              paidAmount: paid,
              pendingAmount: pending
            });
          }
        });
        setPendingApplications(pendingList);
      }
    } catch (err) {
      console.error("Failed to fetch pending applications:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  React.useEffect(() => {
    fetchPendingCases();
  }, []);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiptAmt) {
      toast.error('Please enter receipt amount');
      return;
    }
    
    if (window.confirm('Cash and customer details verified?')) {
      const receiptAmountNum = Number(formData.receiptAmt) || 0;
      const receipt = {
        id: `REC-00${receipts.length + 1}`,
        date: formData.receiptDate || new Date().toLocaleDateString('en-GB'),
        customer: formData.customerName || 'Unknown',
        amount: receiptAmountNum,
        mode: formData.receiptMode,
        status: 'Confirmed',
        applicationNo: formData.applicationNo,
        services: formData.services,
        executive: formData.executive
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
          const apiUrl = import.meta.env.VITE_API_URL || 'https://building-approval.onrender.com/api';
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

          // Refresh pending cases list
          fetchPendingCases();
        } catch (err) {
          console.error("Failed to update case payment on server:", err);
        }
      }

      toast.success('Payment confirmed! Receipt is ready for print.');
      
      sessionStorage.setItem('print_receipt_data', JSON.stringify(receipt));
      window.open(`/print/receipt/${receipt.id}`, '_blank');

      setView('disabled');
      setSelectedCaseRaw(null);
      setFormData(initialFormState);
    }
  };

  const handleReprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.referenceNo) {
      toast.error('No receipt selected to reprint');
      return;
    }

    const receipt = {
      id: formData.referenceNo,
      date: formData.receiptDate,
      customer: formData.customerName,
      amount: Number(formData.receiptAmt),
      mode: formData.receiptMode,
      applicationNo: formData.applicationNo,
      services: formData.services,
      executive: formData.executive
    };

    sessionStorage.setItem('print_receipt_data', JSON.stringify(receipt));
    window.open(`/print/receipt/${receipt.id}`, '_blank');
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
  const isAppNoDisabled = view === 'disabled' || (view === 'add' && formData.type === 'Fresh') || view === 'view';
  const isBottomHalfDisabled = isFormDisabled || formData.receiptMode === 'Cash';
  const isRefNoSearchEnabled = view === 'view'; // Only enable reference search in view mode

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
          {view === 'view' ? 'View/Reprint Receipt' : 'Raise a Receipt'}
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
            
            <DenseField label="Type" value={formData.type} onChange={(e:any) => setFormData({...formData, type: e.target.value})} options={['Fresh', 'Existing']} disabled={isFormDisabled} />
            <DenseField label="Services" value={formData.services} onChange={(e:any) => setFormData({...formData, services: e.target.value})} options={['<Select>', 'Building Approval', 'Layout Approval', 'Other']} disabled={isFormDisabled} />
            <DenseField label="Application Number" value={formData.applicationNo} onChange={(e:any) => setFormData({...formData, applicationNo: e.target.value})} icon={<Search size={14}/>} disabled={isAppNoDisabled} onIconClick={() => !isAppNoDisabled && setIsAppSearchModalOpen(true)} />
            <DenseField label="Reference No." value={formData.referenceNo} readOnly={true} disabled={!isRefNoSearchEnabled} icon={isRefNoSearchEnabled ? <Search size={14}/> : null} onIconClick={() => isRefNoSearchEnabled && setIsReceiptSearchModalOpen(true)} />

            <DenseField label="Customer Name" value={formData.customerName} onChange={(e:any) => setFormData({...formData, customerName: e.target.value})} disabled={isFormDisabled} />
            <DenseField label="Mobile Number" value={formData.mobileNumber} onChange={(e:any) => setFormData({...formData, mobileNumber: e.target.value})} disabled={isFormDisabled} />
            <DenseField label="Executive" value={formData.executive} readOnly={true} disabled={true} />
            
            {formData.type === 'Existing' ? (
              <DenseField label="Balance Amt." value={formData.balance} readOnly={true} disabled={isFormDisabled} />
            ) : (
              <div></div>
            )}

            <DenseField label="Receipt Mode" value={formData.receiptMode} onChange={(e:any) => setFormData({...formData, receiptMode: e.target.value})} options={['Select', 'Cash', 'Bank', 'UPI']} disabled={isFormDisabled} />
            <DenseField label="Receipt Date" value={formData.receiptDate} readOnly={true} disabled={true} icon={<Calendar size={14}/>} />
            <DenseField label="Receipt Amt." value={formData.receiptAmt} onChange={(e:any) => setFormData({...formData, receiptAmt: e.target.value})} disabled={isFormDisabled} />
            <div></div>
            
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }}></div>

        <div style={{ marginBottom: '1.5rem', opacity: isBottomHalfDisabled ? 0.5 : 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem 1rem' }}>
            
            <DenseField label="Type of Inst." value={formData.typeOfInst} onChange={(e:any) => setFormData({...formData, typeOfInst: e.target.value})} options={['Select', 'Type A', 'Type B']} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr.No" value={formData.instrNo} onChange={(e:any) => setFormData({...formData, instrNo: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr. Amount" value={formData.instrAmount} onChange={(e:any) => setFormData({...formData, instrAmount: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr. Date" value={formData.instrDate} onChange={(e:any) => setFormData({...formData, instrDate: e.target.value})} icon={<Calendar size={14}/>} disabled={isBottomHalfDisabled} />

            <DenseField label="Instr. Bank Name" value={formData.instrBankName} onChange={(e:any) => setFormData({...formData, instrBankName: e.target.value})} icon={<Search size={14}/>} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr. Bank Branch" value={formData.instrBankBranch} onChange={(e:any) => setFormData({...formData, instrBankBranch: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Payable At" value={formData.payableAt} onChange={(e:any) => setFormData({...formData, payableAt: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Pay-in-Slip Type" value={formData.payInSlipType} onChange={(e:any) => setFormData({...formData, payInSlipType: e.target.value})} icon={<Search size={14}/>} disabled={isBottomHalfDisabled} />

            <DenseField label="Third Party Remittance" value={formData.thirdPartyRemittance} onChange={(e:any) => setFormData({...formData, thirdPartyRemittance: e.target.value})} options={['Select', 'Yes', 'No']} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr.Bnk.Acc Hold Name" value={formData.instrBnkAccHoldName} onChange={(e:any) => setFormData({...formData, instrBnkAccHoldName: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Instr.Bnk.Acc.No" value={formData.instrBnkAccNo} onChange={(e:any) => setFormData({...formData, instrBnkAccNo: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Gl.code" value={formData.glCode} onChange={(e:any) => setFormData({...formData, glCode: e.target.value})} icon={<Search size={14}/>} disabled={isBottomHalfDisabled} />

            <DenseField label="Remitted By" value={formData.remittedBy} onChange={(e:any) => setFormData({...formData, remittedBy: e.target.value})} disabled={isBottomHalfDisabled} />
            <DenseField label="Print Count" value={formData.printCount} onChange={(e:any) => setFormData({...formData, printCount: e.target.value})} disabled={true} />
            <div></div>
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
            <button onClick={handleReprint} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '8px 32px', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>REPRINT RECEIPT</button>
          </div>
        )}
      </div>

      {isAppSearchModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Pending Payment Applications</h3>
              <button onClick={() => setIsAppSearchModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>App No.</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Customer</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Service</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pending Amt</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCases ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Loading pending applications...
                      </td>
                    </tr>
                  ) : pendingApplications.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No pending applications found.
                      </td>
                    </tr>
                  ) : (
                    pendingApplications.map(app => (
                      <tr key={app.appNo} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{app.appNo}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{app.customer}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{app.service}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{app.pendingAmount.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <button 
                            onClick={() => {
                              setSelectedCaseRaw(app.rawCase);
                              setFormData({
                                ...formData, 
                                applicationNo: app.appNo, 
                                customerName: app.customer, 
                                mobileNumber: app.mobile, 
                                services: app.service, 
                                balance: app.pendingAmount.toString(),
                                receiptAmt: app.pendingAmount.toString()
                              });
                              setIsAppSearchModalOpen(false);
                            }}
                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Select
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

      {isReceiptSearchModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Select Receipt to View/Reprint</h3>
              <button onClick={() => setIsReceiptSearchModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Receipt No.</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Customer</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map(rec => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{rec.id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{rec.customer}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{rec.date}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{rec.amount.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button 
                          onClick={() => {
                            setFormData({
                              ...initialFormState,
                              referenceNo: rec.id,
                              customerName: rec.customer,
                              receiptDate: rec.date,
                              receiptAmt: rec.amount.toString(),
                              receiptMode: rec.mode,
                              applicationNo: rec.applicationNo || '',
                              services: rec.services || '<Select>'
                            });
                            setIsReceiptSearchModalOpen(false);
                          }}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginRight: '0.5rem' }}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => {
                            sessionStorage.setItem('print_receipt_data', JSON.stringify(rec));
                            window.open(`/print/receipt/${rec.id}`, '_blank');
                          }}
                          style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Print
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

export default Receipts;
