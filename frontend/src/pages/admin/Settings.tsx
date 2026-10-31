import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, RefreshCcw, Camera, FileText, Plus, X, PenTool, QrCode, Building, CreditCard, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const Settings: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // File types & expenses
  const defaultFileTypes = ['Building Plan Approval', 'Layout Approval', 'Completion Certificate', 'Patta Transfer'];
  const [fileTypes, setFileTypes] = useState<string[]>(defaultFileTypes);
  const [newFileType, setNewFileType] = useState('');

  const defaultExpenseCategories = ['Office Supplies', 'Travel', 'Meals & Entertainment', 'Utilities', 'Maintenance', 'Salaries'];
  const [expenseCategories, setExpenseCategories] = useState<string[]>(defaultExpenseCategories);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  
  // Admin Signature
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Authorized Signatory');
  const [adminDesignation, setAdminDesignation] = useState<string>('Executive Administrator');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigFileRef = useRef<HTMLInputElement>(null);

  // Bank & Payment QR Details
  const [bankDetails, setBankDetails] = useState({
    companyName: 'C.B. BUILDING APPROVALS',
    tagline: 'Your Approvals Our Responsibility',
    accountName: 'C.B. BUILDING APPROVALS',
    bankName: 'State Bank of India',
    accountNumber: '40123456789',
    ifscCode: 'SBIN0001234',
    branch: 'Shoolagiri Main Branch',
    upiId: 'cbapprovals@upi',
    qrCodeUrl: '',
    paymentInstructions: 'Scan QR code using Google Pay, PhonePe, Paytm or transfer to Bank Account. Enter Proposal Number in remarks.'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const loadBackendSettings = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.adminSignature) setAdminSignature(data.adminSignature);
        if (data.adminName) setAdminName(data.adminName);
        if (data.adminDesignation) setAdminDesignation(data.adminDesignation);
        setBankDetails(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (e) {
      console.warn('Could not fetch backend settings, falling back to localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedPic = localStorage.getItem('profilePicture');
    if (savedPic) setProfilePic(savedPic);

    const savedFileTypesStr = localStorage.getItem('customFileTypes');
    if (savedFileTypesStr) setFileTypes(JSON.parse(savedFileTypesStr));

    const savedExpenseCategories = localStorage.getItem('expenseCategories');
    if (savedExpenseCategories) setExpenseCategories(JSON.parse(savedExpenseCategories));

    const localSig = localStorage.getItem('adminSignature');
    if (localSig) setAdminSignature(localSig);

    const localBank = localStorage.getItem('companyBankDetails');
    if (localBank) {
      try {
        setBankDetails(prev => ({ ...prev, ...JSON.parse(localBank) }));
      } catch (err) {}
    }

    loadBackendSettings();
  }, []);

  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBankDetails(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminSignature(reader.result as string);
        toast.success('Signature image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setAdminSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setAdminSignature('');
  };

  const saveSettings = async () => {
    if (profilePic) {
      localStorage.setItem('profilePicture', profilePic);
    }
    localStorage.setItem('customFileTypes', JSON.stringify(fileTypes));
    localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    if (adminSignature) localStorage.setItem('adminSignature', adminSignature);
    localStorage.setItem('companyBankDetails', JSON.stringify(bankDetails));

    // Persist to backend settings API
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankDetails,
          adminSignature,
          adminName,
          adminDesignation
        })
      });
      toast.success('Settings and Official Signature saved permanently!');
    } catch (e) {
      console.error('Could not save settings to backend:', e);
      toast.success('Settings saved to local storage!');
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const resetDefault = () => {
    setFileTypes(defaultFileTypes);
    setExpenseCategories(defaultExpenseCategories);
    localStorage.setItem('customFileTypes', JSON.stringify(defaultFileTypes));
    localStorage.setItem('expenseCategories', JSON.stringify(defaultExpenseCategories));
    toast.success('Categories reset to defaults.');
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>System Settings & Configuration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage company bank details, UPI QR code, official signature, and system parameters.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Profile Settings */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} color="var(--primary)" /> Profile Picture
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)' }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '2rem', fontWeight: 600 }}>A</span>
              )}
            </div>
            <div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handlePicUpload}
                style={{ display: 'none' }}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Upload Picture
              </button>
            </div>
          </div>
        </div>

        {/* Official Admin Signature */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PenTool size={20} color="var(--primary)" /> Authorized Admin Signature
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, backgroundColor: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
              Used on Official Receipts & Certificates
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Draw your signature directly using mouse/touchpad, or upload a clear transparent PNG image file.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Draw Pad */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Draw Signature</label>
                <button 
                  type="button" 
                  onClick={clearCanvas}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Trash2 size={13} /> Clear Pad
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={360}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                  width: '100%',
                  height: '130px',
                  backgroundColor: '#ffffff',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '0.5rem',
                  cursor: 'crosshair',
                  touchAction: 'none'
                }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Tip: Click and drag to sign your name smoothly.
              </div>
            </div>

            {/* Upload & Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Signature Preview / Upload File
              </label>
              <div style={{ height: '130px', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', overflow: 'hidden' }}>
                {adminSignature ? (
                  <img src={adminSignature} alt="Admin Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    No signature saved yet.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="file" 
                  accept="image/png,image/jpeg" 
                  ref={sigFileRef}
                  onChange={handleSigUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => sigFileRef.current?.click()}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Upload size={14} /> Upload PNG Image
                </button>
                {adminSignature && (
                  <button
                    type="button"
                    onClick={() => { setAdminSignature(''); clearCanvas(); }}
                    style={{ padding: '0.45rem 0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Signatory Name</label>
              <input 
                type="text" 
                value={adminName} 
                onChange={(e) => setAdminName(e.target.value)} 
                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Signatory Designation</label>
              <input 
                type="text" 
                value={adminDesignation} 
                onChange={(e) => setAdminDesignation(e.target.value)} 
                style={{ width: '100%', padding: '0.55rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
          </div>
        </div>

        {/* Company Bank & UPI QR Payment Details */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--primary)" /> Company Bank & UPI QR Payment Details
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, backgroundColor: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
              Shown to Customers on Step 3 Payment
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Configure your official company bank accounts and UPI QR code where customer payments will be made.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Company / Account Name *</label>
              <input 
                type="text" 
                value={bankDetails.accountName} 
                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })} 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Bank Name *</label>
              <input 
                type="text" 
                value={bankDetails.bankName} 
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Account Number *</label>
              <input 
                type="text" 
                value={bankDetails.accountNumber} 
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>IFSC Code *</label>
              <input 
                type="text" 
                value={bankDetails.ifscCode} 
                onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })} 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Branch Name</label>
              <input 
                type="text" 
                value={bankDetails.branch} 
                onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })} 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Company UPI ID (GPay / PhonePe / Paytm)</label>
              <input 
                type="text" 
                value={bankDetails.upiId} 
                onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })} 
                placeholder="e.g. cbapprovals@upi"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} 
              />
            </div>
          </div>

          {/* QR Code Upload & Preview */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
            <div style={{ width: '110px', height: '110px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {bankDetails.qrCodeUrl ? (
                <img src={bankDetails.qrCodeUrl} alt="Company UPI QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                  <QrCode size={36} color="var(--primary)" style={{ margin: '0 auto 0.25rem' }} />
                  <div style={{ fontSize: '0.65rem' }}>No QR Code</div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Company Payment QR Code Image</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
                Upload your official UPI QR code (Google Pay, PhonePe, BharatPe, Paytm QR). Customers will scan this code to pay.
              </p>
              <input 
                type="file" 
                accept="image/*" 
                ref={qrInputRef}
                onChange={handleQrUpload}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => qrInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Upload size={14} /> Upload QR Image
                </button>
                {bankDetails.qrCodeUrl && (
                  <button
                    type="button"
                    onClick={() => setBankDetails(prev => ({ ...prev, qrCodeUrl: '' }))}
                    style={{ padding: '0.45rem 0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Remove QR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expense Categories Settings */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="var(--primary)" /> Expense Categories Customization
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={newExpenseCategory} 
                onChange={(e) => setNewExpenseCategory(e.target.value)} 
                placeholder="Enter new expense category" 
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.875rem' }} 
              />
              <button 
                type="button" 
                onClick={() => {
                  if (newExpenseCategory.trim() && !expenseCategories.includes(newExpenseCategory.trim())) {
                    setExpenseCategories([...expenseCategories, newExpenseCategory.trim()]);
                    setNewExpenseCategory('');
                  }
                }} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {expenseCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>{cat}</span>
                  <button 
                    type="button" 
                    onClick={() => setExpenseCategories(expenseCategories.filter(t => t !== cat))}
                    style={{ background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {expenseCategories.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No expense categories available. Add one above.</p>}
            </div>
          </div>
        </div>

        {/* Service/File Types Settings */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} color="var(--primary)" /> Service / File Types Customization
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={newFileType} 
                onChange={(e) => setNewFileType(e.target.value)} 
                placeholder="Enter new service or file type" 
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontSize: '0.875rem' }} 
              />
              <button 
                type="button" 
                onClick={() => {
                  if (newFileType.trim() && !fileTypes.includes(newFileType.trim())) {
                    setFileTypes([...fileTypes, newFileType.trim()]);
                    setNewFileType('');
                  }
                }} 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {fileTypes.map((type, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>{type}</span>
                  <button 
                    type="button" 
                    onClick={() => setFileTypes(fileTypes.filter(t => t !== type))}
                    style={{ background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {fileTypes.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No file types available. Add one above.</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={saveSettings}
            className="btn-primary"
            style={{ borderRadius: '0.375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
          >
            {saved ? <CheckCircle size={18} /> : null} {saved ? 'Saved Successfully' : 'Save All Settings'}
          </button>
          
          <button 
            onClick={resetDefault}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCcw size={18} /> Reset Categories
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
