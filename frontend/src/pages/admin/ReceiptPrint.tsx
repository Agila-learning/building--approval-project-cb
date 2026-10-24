import React from 'react';
import { useParams } from 'react-router-dom';
import { Phone, Mail, Globe, CheckCircle2 } from 'lucide-react';

const ReceiptPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receiptData, setReceiptData] = React.useState<any>(null);

  React.useEffect(() => {
    const data = sessionStorage.getItem('print_receipt_data');
    if (data) {
      setReceiptData(JSON.parse(data));
    }
  }, []);

  const receiptId = receiptData?.id || id || 'REC-2026-00125';

  React.useEffect(() => {
    document.title = `Receipt - ${receiptId}`;
  }, [receiptId]);

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem 0', fontFamily: '"Inter", sans-serif' }}>
      <style>
        {`
          * {
            box-sizing: border-box;
          }
          @media print {
            body, html { background: white; margin: 0; padding: 0; height: 100%; }
            .no-print { display: none !important; }
            .receipt-container { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 16px !important; 
              width: 148mm !important; 
              height: 209mm !important; 
              overflow: hidden !important;
              page-break-after: avoid;
            }
            @page { size: A5 portrait; margin: 0; }
          }
        `}
      </style>
      
      {/* A5 Container */}
      <div className="receipt-container" style={{ 
        width: '148mm', 
        height: '210mm', 
        backgroundColor: '#ffffff', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>

        {/* Action button for preview */}
        <button 
          className="no-print"
          onClick={() => window.print()}
          style={{ position: 'absolute', top: '-40px', right: 0, padding: '0.5rem 1rem', backgroundColor: '#0b63ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
        >
          Print Receipt
        </button>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#0b63ce', display: 'flex', alignItems: 'center' }}>
                {/* Logo image */}
                <img src="/assets/logo.jpeg" alt="C.B. Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#cc0000', fontFamily: 'Arial, sans-serif', letterSpacing: '0.02em' }}>
                  C.B. BUILDING APPROVALS
                </div>
                <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#475569', fontWeight: 600 }}>
                  Your approval, our responsibility
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, border: '1px solid #bbf7d0', letterSpacing: '0.5px' }}>
              PAID
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Receipt No: <span style={{ color: '#0f172a', fontWeight: 600 }}>{receiptId}</span></div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Date: <span style={{ color: '#0f172a', fontWeight: 600 }}>{receiptData?.date || '03 Oct 2026'}</span></div>
          </div>
        </div>

        <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#0b63ce', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
          Payment Receipt
        </h1>

        {/* CUSTOMER & APPLICATION SECTION */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#0b63ce', marginBottom: '8px', textTransform: 'uppercase' }}>Customer Details</div>
            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600, marginBottom: '4px' }}>{receiptData?.customer || 'Rajesh Kumar'}</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>Mobile: {receiptData?.mobile || '+91 98765 43210'}</div>
          </div>
          
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#0b63ce', marginBottom: '8px', textTransform: 'uppercase' }}>Application Details</div>
            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600, marginBottom: '4px' }}>ID: {receiptData?.applicationNo || 'BA-2026-00452'}</div>
            <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>No. 12, New Housing Board Layout, Hosur, Krishnagiri, Tamil Nadu</div>
          </div>
        </div>

        {/* CUSTOMER CONFIRMATION */}
        <div style={{ backgroundColor: '#f0f9ff', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CheckCircle2 size={16} color="#0ea5e9" />
          <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 500, lineHeight: 1.2 }}>Payment received successfully against Application ID {receiptData?.applicationNo || 'BA-2026-00452'}.</span>
        </div>

        {/* PAYMENT DETAILS */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>Payment Breakdown</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
              <span>{receiptData?.services && receiptData.services !== '<Select>' ? receiptData.services : 'Building Approval Service'}</span>
              <span>₹{receiptData?.amount ? Number(receiptData.amount).toLocaleString('en-IN') : '15,000'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
              <span>Total Paid</span>
              <span style={{ color: '#0b63ce' }}>₹{receiptData?.amount ? Number(receiptData.amount).toLocaleString('en-IN') : '21,000'}</span>
            </div>
          </div>
        </div>

        {/* PAYMENT INFORMATION */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ flex: '1 1 45%' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Payment Mode</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{receiptData?.mode || 'UPI'}</div>
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Transaction ID</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>UPI123456789</div>
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Date & Time</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{receiptData?.date || '03 Oct 2026'}</div>
          </div>
          <div style={{ flex: '1 1 45%' }}>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Status</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>PAID</div>
          </div>
        </div>

        <div style={{ flexGrow: 1 }}></div>

        {/* BOTTOM SECTION (Raised By & QR) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', marginBottom: '12px' }}>
          {/* RECEIPT RAISED BY */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#0b63ce', textTransform: 'uppercase', marginBottom: '6px' }}>Receipt Raised By</div>
            <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600 }}>{receiptData?.executive || 'Admin User'}</div>
            <div style={{ fontSize: '10px', color: '#475569' }}>{receiptData?.empId || 'EMP-0001'} | {receiptData?.role || 'Administrator'}</div>
            <div style={{ fontSize: '10px', color: '#475569' }}>Shoolagiri Office</div>
          </div>
          
          {/* VERIFICATION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>Scan to Verify</div>
              <div style={{ fontSize: '8px', color: '#64748b', maxWidth: '80px', lineHeight: 1.2 }}>Scan the QR code to verify authenticity.</div>
            </div>
            <div style={{ padding: '4px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=48x48&data=${encodeURIComponent(`https://buildingapproval.in/verify/${receiptId}`)}`} alt="QR Code" width={48} height={48} />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ backgroundColor: '#0f172a', color: 'white', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
              <Phone size={10} color="#94a3b8" /> +91 8940206541
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
              <Mail size={10} color="#94a3b8" /> cb.construction2019@gmail.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
              <Globe size={10} color="#94a3b8" /> www.buildingapproval.in
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '8px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
            This is a computer generated digital receipt. No signature is required.
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceiptPrint;
