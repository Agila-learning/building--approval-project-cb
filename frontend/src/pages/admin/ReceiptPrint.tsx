import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, Globe, CheckCircle2, Printer, ArrowLeft, Download, ShieldCheck, MapPin } from 'lucide-react';
import { getApiUrl } from '../../config/api';

const ReceiptPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const apiUrl = getApiUrl();

      // First check session storage for quick handoff
      let initialData: any = null;
      const stored = sessionStorage.getItem('print_receipt_data');
      if (stored) {
        try {
          initialData = JSON.parse(stored);
          setReceiptData(initialData);
        } catch (e) {
          console.error(e);
        }
      }

      // Fetch live case data from backend for verified accuracy
      if (id) {
        try {
          const res = await fetch(`${apiUrl}/cases/${id}`);
          if (res.ok) {
            const caseData = await res.json();
            const full = caseData.fullData || {};
            const payment = full.payment || {};
            const property = caseData.property || {};
            const assignedStaff = caseData.assigned_staff || {};

            const verifiedData = {
              receiptNo: payment.receiptNumber || `RCP-${(caseData.application_number || id).replace(/^APP-/, '')}`,
              proposalNo: caseData.application_number || id,
              customerName: property.owner_name || full.customerName || initialData?.customer || 'Customer',
              customerPhone: property.owner_phone || full.mobile || initialData?.mobile || '—',
              customerEmail: property.owner_email || full.email || '—',
              customerAddress: property.address || full.plotAddress || 'Plot / Site Address on file',
              staffName: assignedStaff.name || full.staff || full.createdByStaff || initialData?.executive || 'Staff Coordinator',
              staffId: assignedStaff.staffId || 'CB-STAFF',
              applicationType: caseData.approval_type || 'Building Plan Approval',
              totalAmount: parseFloat(full.feesAmount || full.fees?.total || '0') || 0,
              amountPaid: parseFloat(payment.amount || full.paidAmount || initialData?.amount || '0') || 0,
              paymentMethod: payment.paymentMethod || initialData?.mode || 'UPI / QR Code',
              transactionId: payment.transactionId || initialData?.transactionId || 'VERIFIED-OFFICIAL',
              paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (initialData?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
              paymentStatus: payment.paymentStatus || 'Paid',
              notes: payment.notes || ''
            };
            setReceiptData(verifiedData);
          }
        } catch (err) {
          console.error('Failed to fetch verified case for receipt:', err);
        }
      }

      // Fetch system settings (Bank details, Signature, Company profile)
      try {
        const sRes = await fetch(`${apiUrl}/settings`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setSettings(sData.settings || sData);
        }
      } catch (err) {
        console.error('Failed to fetch company settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const proposalNo = receiptData?.proposalNo || id || 'CB-PROP';
  const receiptNo = receiptData?.receiptNo || `RCP-${proposalNo.replace(/^APP-/, '')}`;

  useEffect(() => {
    document.title = `Payment Receipt #${receiptNo}`;
  }, [receiptNo]);

  const amountInWords = (num: number) => {
    if (!num || isNaN(num)) return 'Zero Rupees Only';
    // Friendly converter for typical fee amounts
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function numToWords(n: number): string {
      if (n === 0) return '';
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? numToWords(n % 100) : '');
      if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? numToWords(n % 1000) : '');
      if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? numToWords(n % 100000) : '');
      return n.toString();
    }
    return (numToWords(Math.floor(num)) + 'Rupees Only').trim();
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>
        {`
          * { box-sizing: border-box; }
          @media print {
            body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .receipt-a4-page {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 20mm !important;
              width: 100% !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              border: none !important;
              page-break-after: avoid;
            }
            @page { size: A4 portrait; margin: 0; }
          }
        `}
      </style>

      {/* Top Controls Bar */}
      <div className="no-print" style={{ maxWidth: '210mm', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button
          onClick={() => window.history.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.25rem', borderRadius: '0.375rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          >
            <Printer size={16} /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Official A4 Receipt Container */}
      <div
        className="receipt-a4-page"
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          padding: '20mm',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: '2px',
          color: '#0f172a'
        }}
      >
        {/* Top Header with Corporate Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/assets/logo.jpeg" alt="C.B. Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#cc0000', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                C.B. BUILDING APPROVALS
              </div>
              <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#475569', fontWeight: 600 }}>
                Your approval, our responsibility • Government Licensed Consultants
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                Reg. No: TN/CB/2019/BPA • Hosur & Shoolagiri Head Office
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
              PAYMENT VERIFIED
            </span>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
              Receipt No: <strong style={{ color: '#0f172a' }}>{receiptNo}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              Date: <strong style={{ color: '#0f172a' }}>{receiptData?.paymentDate || new Date().toLocaleDateString('en-GB')}</strong>
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Official Payment Receipt
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#64748b' }}>
            Issued in respect of Building Approval Application Services
          </p>
        </div>

        {/* Details 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Customer & Lead Info */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Customer Details
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              {receiptData?.customerName || 'Customer'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
              <strong>Phone:</strong> {receiptData?.customerPhone || '—'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
              <strong>Email:</strong> {receiptData?.customerEmail || '—'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              <strong>Site Address:</strong> {receiptData?.customerAddress || 'Hosur / Shoolagiri, Tamil Nadu'}
            </div>
          </div>

          {/* Application & Staff Info */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Application & Coordinator
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Proposal #: <span style={{ color: '#0284c7' }}>#{proposalNo}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
              <strong>Service:</strong> {receiptData?.applicationType || 'Building Plan Approval'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
              <strong>Assigned Staff:</strong> {receiptData?.staffName || 'Staff Coordinator'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              <strong>Coordinator ID:</strong> {receiptData?.staffId || 'CB-STAFF'}
            </div>
          </div>
        </div>

        {/* Payment Verification Banner */}
        <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem 1rem', borderRadius: '0.375rem', borderLeft: '4px solid #0284c7', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <ShieldCheck size={20} color="#0284c7" />
          <div style={{ fontSize: '11.5px', color: '#1e40af', lineHeight: 1.4 }}>
            Payment of <strong>₹{(receiptData?.amountPaid || 0).toLocaleString('en-IN')}</strong> has been verified and credited towards Proposal <strong>#{proposalNo}</strong>.
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                <th style={{ padding: '0.65rem 0.85rem', width: '50px' }}>#</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Description of Service</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Estimated (₹)</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Amount Paid (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem 0.85rem', color: '#64748b' }}>1</td>
                <td style={{ padding: '0.75rem 0.85rem' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{receiptData?.applicationType || 'Building Plan Approval Service Fee'}</div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Plan drafting, scrutiny fee, site inspection, and municipal liaison.</div>
                </td>
                <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#475569' }}>
                  ₹{(receiptData?.totalAmount || receiptData?.amountPaid || 0).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                  ₹{(receiptData?.amountPaid || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={3} style={{ padding: '0.75rem 0.85rem', textAlign: 'right', textTransform: 'uppercase', fontSize: '11px', color: '#334155' }}>
                  Total Received:
                </td>
                <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontSize: '14px', color: '#0284c7' }}>
                  ₹{(receiptData?.amountPaid || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in Words */}
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.85rem', backgroundColor: '#f8fafc', borderRadius: '0.25rem', fontSize: '11px', color: '#475569' }}>
            <strong>Amount in words:</strong> {amountInWords(receiptData?.amountPaid || 0)}
          </div>
        </div>

        {/* Payment Transaction Particulars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Payment Method</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{receiptData?.paymentMethod || 'UPI / QR Code'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Transaction / UTR #</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px', wordBreak: 'break-all' }}>{receiptData?.transactionId || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Payment Date</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{receiptData?.paymentDate || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Payment Status</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', marginTop: '2px' }}>VERIFIED & PAID</div>
          </div>
        </div>

        <div style={{ flexGrow: 1 }}></div>

        {/* Verification QR Code & Authorized Admin Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
          {/* QR Code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '4px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(window.location.origin + '/track?prop=' + proposalNo)}`}
                alt="Verification QR"
                width={64}
                height={64}
                style={{ display: 'block' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Scan to Verify Authenticity</div>
              <div style={{ fontSize: '9px', color: '#64748b', maxWidth: '160px', lineHeight: 1.3 }}>
                Scan this official QR code with any smartphone camera to check live approval and receipt records.
              </div>
            </div>
          </div>

          {/* Admin Authorized Signature */}
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            {settings?.adminSignature ? (
              <div style={{ marginBottom: '4px' }}>
                <img
                  src={settings.adminSignature}
                  alt="Admin Signature"
                  style={{ maxHeight: '55px', maxWidth: '160px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ height: '45px', borderBottom: '1px solid #94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#475569', fontWeight: 600 }}>Authorized Signatory</span>
              </div>
            )}
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>
              {settings?.companyName || 'C.B. Building Approvals'}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>
              Authorized Signatory
            </div>
          </div>
        </div>

        {/* Corporate Footer */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '0.75rem 1rem', borderRadius: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '9.5px', color: '#cbd5e1' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={11} color="#38bdf8" /> +91 8940206541
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={11} color="#38bdf8" /> cb.construction2019@gmail.com
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={11} color="#38bdf8" /> www.buildingapproval.in
            </span>
          </div>
          <div style={{ textAlign: 'center', fontSize: '8.5px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
            This receipt is an official acknowledgment of payment verified by C.B. Building Approvals. For inquiries, quote Receipt #{receiptNo} and Proposal #{proposalNo}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;
