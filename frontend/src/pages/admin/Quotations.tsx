import React, { useState } from 'react';
import { Printer, FileText, User, History } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const Quotations: React.FC = () => {
  const [savedQuotations, setSavedQuotations] = useState<any[]>(() => {
    const saved = localStorage.getItem('savedQuotations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentQtNo, setCurrentQtNo] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState<{name: string, amount: number}[]>([
    { name: 'Building Plan Approval', amount: 0 }
  ]);

  const handleAddService = () => {
    setServices([...services, { name: '', amount: 0 }]);
  };

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleRemoveService = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
  };

  const totalAmount = services.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const quotationDate = new Date().toLocaleDateString();

  const handleGeneratePDF = () => {
    const qtNo = currentQtNo || `QT-${String(savedQuotations.length + 1).padStart(4, '0')}`;
    
    if (!currentQtNo) {
      setCurrentQtNo(qtNo);
      const newRecord = { qtNo, customerName, phone, location, services, totalAmount, date: quotationDate };
      const updated = [newRecord, ...savedQuotations];
      setSavedQuotations(updated);
      localStorage.setItem('savedQuotations', JSON.stringify(updated));
    }

    const element = document.getElementById('quotation-template');
    if (element) {
      // Ensure the QT No is in the DOM before printing
      const qtNoElem = document.getElementById('qt-serial-number');
      if (qtNoElem) {
        qtNoElem.innerText = `Quotation No: ${qtNo}`;
      }

      const opt = {
        margin:       0,
        filename:     `${qtNo}_${customerName || 'Customer'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      element.style.display = 'block';
      html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
      });
    }
  };

  const loadQuotation = (q: any) => {
    setCurrentQtNo(q.qtNo);
    setCustomerName(q.customerName);
    setPhone(q.phone);
    setLocation(q.location);
    setServices(q.services);
  };

  const handleNewQuotation = () => {
    setCurrentQtNo('');
    setCustomerName('');
    setPhone('');
    setLocation('');
    setServices([{ name: 'Building Plan Approval', amount: 0 }]);
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>Quotation Generator</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Create and download quotations for services.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {currentQtNo && (
            <button 
              onClick={handleNewQuotation}
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              New Quotation
            </button>
          )}
          <button 
            onClick={handleGeneratePDF}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            <Printer size={18} /> Generate PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Form Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '2rem' }}>
            <h3 className="heading-3" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--primary)" /> Customer Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter full name" style={{ padding: '0.75rem' }} />
              </div>
              <div>
                <label className="form-label">Mobile Number</label>
                <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91" style={{ padding: '0.75rem' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Project Location / Address</label>
                <textarea className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter full property address" rows={2} style={{ padding: '0.75rem' }}></textarea>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h3 className="heading-3" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> Services & Pricing
            </h3>
            
            {services.map((service, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Service Description</label>
                  <input type="text" className="form-input" value={service.name} onChange={e => handleServiceChange(index, 'name', e.target.value)} placeholder="e.g. Building Plan Approval" style={{ padding: '0.75rem' }} />
                </div>
                <div style={{ width: '150px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Amount (₹)</label>
                  <input type="number" className="form-input" value={service.amount || ''} onChange={e => handleServiceChange(index, 'amount', Number(e.target.value))} placeholder="0" style={{ padding: '0.75rem' }} />
                </div>
                {services.length > 1 && (
                  <button onClick={() => handleRemoveService(index)} style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button onClick={handleAddService} className="btn-secondary" style={{ marginTop: '1rem' }}>
              + Add Another Service
            </button>
          </div>

        </div>

        {/* Summary Column */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>Quotation Summary</h3>
            
            {services.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.875rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{s.name || 'Untitled Service'}</span>
                <span style={{ fontWeight: 600 }}>₹{(Number(s.amount) || 0).toLocaleString()}</span>
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Total Amount</span>
              <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent)' }}>₹{totalAmount.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={handleGeneratePDF}
              style={{ width: '100%', padding: '1rem', marginTop: '2rem', backgroundColor: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Printer size={18} /> Print PDF
            </button>
          </div>
        </div>

      </div>
      
      {/* Quotation History Table */}
      <div className="card" style={{ marginTop: '3rem', padding: '2rem' }}>
        <h3 className="heading-3" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} color="var(--primary)" /> Saved Quotations History
        </h3>
        {savedQuotations.length > 0 ? (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Quotation No</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Customer Name</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>Total Amount</th>
                  <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedQuotations.map((q, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{q.qtNo}</td>
                    <td style={{ padding: '1rem' }}>{q.date}</td>
                    <td style={{ padding: '1rem' }}>{q.customerName}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{q.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => loadQuotation(q)}
                        className="btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <FileText size={14} /> View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No saved quotations yet.
          </div>
        )}
      </div>

      {/* Hidden PDF Template */}
      <div style={{ display: 'none' }}>
        <div id="quotation-template" style={{ padding: '20px', backgroundColor: '#fff', color: '#000', width: '190mm', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1044C4', paddingBottom: '20px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img src="/assets/logo.jpeg" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, color: '#1044C4', fontSize: '28px', fontWeight: 800 }}>C.B. BUILDING APPROVALS</h1>
                <p style={{ margin: '5px 0 0 0', color: '#E9A83A', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Quality is our success</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', paddingTop: '10px' }}>
              <p id="qt-serial-number" style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '18px', color: '#1044C4' }}>Quotation No: {currentQtNo}</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Date: {quotationDate}</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#1044C4', fontSize: '24px', letterSpacing: '4px', textDecoration: 'underline' }}>QUOTATION</h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div>
              <h3 style={{ color: '#555', marginBottom: '10px' }}>Quotation For:</h3>
              <p style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>{customerName || 'Customer Name'}</p>
              <p style={{ margin: '0 0 5px 0' }}>Phone: {phone || 'N/A'}</p>
              <p style={{ margin: '0 0 5px 0' }}>Location: {location || 'N/A'}</p>
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1044C4', color: '#fff' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Service Description</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '15px 12px' }}>{s.name || 'Service'}</td>
                  <td style={{ padding: '15px 12px', textAlign: 'right' }}>₹{(Number(s.amount) || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontWeight: 'bold', fontSize: '20px', borderTop: '2px solid #1044C4' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#d32f2f' }}>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px', color: '#555', fontSize: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px 0' }}>Thank you for your interest in our services!</p>
            <p style={{ margin: 0 }}>This quotation is valid for 30 days. Please contact us to proceed.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Quotations;
