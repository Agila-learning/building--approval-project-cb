import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, Printer, FileText, Clock } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { getApiUrl } from '../../config/api';

const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseRecord, setCaseRecord] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [collectionAmount, setCollectionAmount] = useState('');
  const [newStatus, setNewStatus] = useState('Pending');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/cases/${id}`);
        let c: any = null;
        if (res.ok) {
          c = await res.json();
        } else {
          // If not found by direct ID (might be application_number), query list
          const listRes = await fetch(`${apiUrl}/cases`);
          if (listRes.ok) {
            const list = await listRes.json();
            c = list.find((item: any) => item.id === id || item.application_number === id);
          }
        }
        
        if (c) {
          setCaseRecord(c);
          const total = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
          const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
          const pending = c.fees?.pending !== undefined && c.fees?.pending !== null 
            ? Number(c.fees.pending) 
            : Math.max(0, total - paid);

          let status = 'Pending';
          if (pending === 0 && total > 0) {
            status = 'Paid';
          } else if (paid > 0 && pending > 0) {
            status = 'Partial';
          } else {
            status = 'Pending';
          }
          
          setPayment({
            id: c.application_number || c.id || id,
            mongoId: c.id,
            customer: c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer',
            type: c.approval_type || c.type || 'Building Plan Approval',
            totalAmount: total,
            paidAmount: paid,
            pendingAmount: pending,
            status: status,
            date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A',
            phone: c.property?.owner_phone || c.fullData?.mobile || c.mobile || 'Not provided',
            location: c.property?.jurisdiction || c.location || 'DTCP',
            address: c.property?.address || c.address || 'Not provided',
            notes: c.fees?.notes || c.fullData?.feeNotes || ''
          });
          setNewStatus(status);
        } else {
          setPayment(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchPaymentDetails();
    
    // Load Customer Photo if available
    const savedDocs = localStorage.getItem(`customerDocs_${id}`);
    if (savedDocs) {
      try {
        const docs = JSON.parse(savedDocs);
        const photoDoc = docs.find((d: any) => d.id === 'photo');
        if (photoDoc && photoDoc.fileData) {
          setCustomerPhoto(photoDoc.fileData);
        }
      } catch (e) {
        console.error("Error parsing docs for photo", e);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!payment) return;
    const amount = parseFloat(collectionAmount) || 0;
    const totalPaidNow = payment.paidAmount + amount;
    
    if (amount > 0) {
      if (totalPaidNow >= payment.totalAmount) {
        setNewStatus('Paid');
      } else {
        setNewStatus('Partial');
      }
    }
  }, [collectionAmount, payment]);

  const handleSavePayment = async () => {
    if (!payment) return;
    
    const amountToAdd = parseFloat(collectionAmount) || 0;
    const newPaid = payment.paidAmount + amountToAdd;
    const total = payment.totalAmount;
    const newPending = Math.max(0, total - newPaid);

    let finalStatus = newStatus;
    if (newPending === 0 && total > 0) {
      finalStatus = 'Paid';
    } else if (newPaid > 0 && newPending > 0) {
      finalStatus = 'Partial';
    }

    setIsSaving(true);
    try {
      const apiUrl = getApiUrl();
      const targetId = caseRecord?.id || payment.mongoId || payment.id;
      
      const existingCharges = caseRecord?.fees?.charges || caseRecord?.fullData?.fees?.charges || [];
      const updatedCharges = [...existingCharges];
      if (amountToAdd > 0) {
        updatedCharges.push({
          id: `chg-${Date.now()}`,
          description: notes.trim() || `Payment via ${paymentMode}`,
          amount: amountToAdd,
          mode: paymentMode,
          date: new Date().toISOString()
        });
      }

      const updatedFees = {
        total: total,
        paid: newPaid,
        pending: newPending,
        notes: notes.trim() || payment.notes || '',
        charges: updatedCharges
      };

      await fetch(`${apiUrl}/cases/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fees: updatedFees,
          fullData: {
            ...(caseRecord?.fullData || {}),
            feesAmount: total.toString(),
            paidAmount: newPaid.toString(),
            feeNotes: updatedFees.notes,
            fees: updatedFees
          }
        })
      });

      alert(`Payment of ₹${amountToAdd} recorded successfully. Status updated to ${finalStatus}.`);
      navigate('/admin/payments');
    } catch (err) {
      console.error("Failed to persist payment:", err);
      alert(`Payment updated locally. Status is ${finalStatus}.`);
      navigate('/admin/payments');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = (type: 'receipt' | 'invoice') => {
    const element = document.getElementById(`${type}-template`);
    if (!element) return;
    
    element.style.display = 'block';
    const opt = {
      margin:       10,
      filename:     `${type === 'receipt' ? 'Receipt' : 'Invoice'}_${payment.id}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
    });
  };

  if (!payment) {
    return <div style={{ padding: '2rem' }}>Loading payment details...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/admin/payments')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="heading-3" style={{ marginBottom: '0.25rem' }}>Update Payment Details</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Application ID: {payment.id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => handleGeneratePDF('receipt')}
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <Printer size={16} /> Print Receipt
          </button>
          <button 
            onClick={() => handleGeneratePDF('invoice')}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <FileText size={16} /> Generate Invoice
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Column */}
        <div>
          {/* Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 className="heading-3" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={20} color="var(--primary)" /> Record New Collection
            </h3>

            <div className="form-group">
              <label className="form-label">Collection Amount (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Enter amount collected..." 
                value={collectionAmount}
                onChange={(e) => setCollectionAmount(e.target.value)}
                min="0"
                max={payment.pendingAmount}
                style={{ fontSize: '1.125rem', padding: '1rem' }}
              />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Maximum collectable amount: <strong>₹{payment.pendingAmount.toLocaleString()}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Mode of Payment</label>
                <select 
                  className="form-input"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ padding: '1rem' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="GPay">GPay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Bank Transfer (A/C)">Bank Transfer (A/C)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Material">Material</option>
                </select>
              </div>
              <div>
                <label className="form-label">Payment Status</label>
                <select 
                  className="form-input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                  disabled
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Payment Notes (Optional)</label>
              <textarea 
                className="form-input" 
                rows={4}
                placeholder="E.g. Paid via Bank Transfer, Reference No: TXN12345"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
              <button className="btn-secondary" onClick={() => navigate('/admin/payments')}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSavePayment} disabled={isSaving}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>

          {/* Payment History Section */}
          <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
            <h3 className="heading-3" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary)" /> Payment History
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Mode</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Reference</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payment.paidAmount > 0 ? (
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0' }}>{payment.date !== 'N/A' ? payment.date : new Date().toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 0' }}>{paymentMode}</td>
                    <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>-</td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600, color: '#2F7D5A' }}>₹{payment.paidAmount.toLocaleString()}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No previous payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
          
          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-surface)' }}>
            <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>Payment Summary</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Total Amount</span>
              <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>₹{payment.totalAmount.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>Amount Paid</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{payment.paidAmount.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Balance Due</span>
              <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>₹{payment.pendingAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Customer Details</h4>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{payment.customer}</div>
            </div>
            
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact</div>
              <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{payment.phone}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Property Location</div>
              <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{payment.location}</div>
            </div>
          </div>
          
        </div>

      </div>

      {/* Hidden PDF Templates */}
      <div style={{ display: 'none' }}>
        {/* Receipt PDF Template */}
        <div id="receipt-template" style={{ padding: '20px', backgroundColor: '#fff', color: '#000', width: '190mm', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1044C4', paddingBottom: '20px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img src="/assets/logo.jpeg" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, color: '#1044C4', fontSize: '28px', fontWeight: 800 }}>C.B. BUILDING APPROVALS</h1>
                <p style={{ margin: '5px 0 0 0', color: '#E9A83A', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Quality is our success</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '24px', letterSpacing: '2px' }}>CASH RECEIPT</h2>
              <p style={{ margin: '8px 0 0 0', fontWeight: 'bold' }}>No: <span style={{ color: '#d32f2f' }}>RCT-{payment.id.split('-').pop()}</span></p>
              <p style={{ margin: '4px 0 0 0' }}>Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ flex: 1, marginBottom: '40px', lineHeight: '2' }}>
              <p style={{ margin: 0, fontSize: '18px' }}><strong>Received From:</strong> <span style={{ textDecoration: 'underline' }}>{payment.customer}</span></p>
              <p style={{ margin: 0, fontSize: '18px' }}><strong>Address:</strong> <span style={{ textDecoration: 'underline' }}>{payment.address}</span></p>
              <p style={{ margin: 0, fontSize: '18px' }}><strong>Amount:</strong> <span style={{ textDecoration: 'underline' }}>₹{payment.paidAmount.toLocaleString()}</span></p>
              <p style={{ margin: 0, fontSize: '18px' }}><strong>Mode of Payment:</strong> <span style={{ textDecoration: 'underline' }}>{paymentMode}</span></p>
              <p style={{ margin: 0, fontSize: '18px' }}><strong>For Payment of:</strong> <span style={{ textDecoration: 'underline' }}>{payment.type} Services ({payment.location})</span></p>
              <p style={{ margin: 0, fontSize: '18px' }}><strong>Ref. Invoice No:</strong> <span style={{ textDecoration: 'underline' }}>{payment.id}</span></p>
            </div>
            {customerPhoto && (
              <div style={{ width: '120px', height: '140px', border: '2px solid #ccc', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={customerPhoto} alt="Customer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px', borderTop: '1px dashed #ccc', paddingTop: '30px' }}>
            <div style={{ border: '2px solid #1044C4', padding: '10px 20px', borderRadius: '8px', backgroundColor: '#f0f4ff' }}>
               <h2 style={{ margin: 0, color: '#1044C4' }}>Amount: ₹{payment.paidAmount.toLocaleString()}</h2>
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '5px' }}></div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Invoice PDF Template */}
        <div id="invoice-template" style={{ padding: '20px', backgroundColor: '#fff', color: '#000', width: '190mm', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1044C4', paddingBottom: '20px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img src="/assets/logo.jpeg" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, color: '#1044C4', fontSize: '28px', fontWeight: 800 }}>C.B. BUILDING APPROVALS</h1>
                <p style={{ margin: '5px 0 0 0', color: '#E9A83A', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Quality is our success</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, color: '#1044C4', fontSize: '28px', letterSpacing: '2px' }}>INVOICE</h2>
              <p style={{ margin: '8px 0 0 0', fontWeight: 'bold' }}>Invoice #: INV-{payment.id}</p>
              <p style={{ margin: '4px 0 0 0' }}>Date: {new Date().toLocaleDateString()}</p>
              <p style={{ margin: '4px 0 0 0' }}>Due Date: {new Date(new Date().setDate(new Date().getDate() + 15)).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div>
              <h3 style={{ color: '#555', marginBottom: '10px' }}>Billed To:</h3>
              <p style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>{payment.customer}</p>
              <p style={{ margin: '0 0 5px 0' }}>Address: {payment.address}</p>
              <p style={{ margin: '0 0 5px 0' }}>Phone: {payment.phone}</p>
              <p style={{ margin: '0 0 5px 0' }}>Location: {payment.location}</p>
            </div>
            {customerPhoto && (
              <div style={{ width: '100px', height: '120px', border: '2px solid #eee', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={customerPhoto} alt="Customer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1044C4', color: '#fff' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '15px 12px' }}>{payment.type} Services ({payment.location})</td>
                <td style={{ padding: '15px 12px', textAlign: 'right' }}>₹{payment.totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>Subtotal:</span>
                <span>₹{payment.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #1044C4', color: '#2F7D5A' }}>
                <span>Amount Paid:</span>
                <span>-₹{payment.paidAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontWeight: 'bold', fontSize: '20px' }}>
                <span>Balance Due:</span>
                <span style={{ color: '#d32f2f' }}>₹{payment.pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px', color: '#555', fontSize: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px 0' }}>Thank you for your business!</p>
            <p style={{ margin: 0 }}>If you have any questions about this invoice, please contact us.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentDetail;
