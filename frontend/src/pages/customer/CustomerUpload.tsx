import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, CheckCircle2, FileText, ShieldCheck, AlertCircle, X, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFileToCloudinary, getApiUrl } from '../../config/api';
import { validateUploadFile } from '../../utils/imageValidation';

const CustomerUpload: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [requestedDocIds, setRequestedDocIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default documents fallback
  // Canonical document normalization helper
  const normalizeDocKey = (key: string) => (key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  const getCanonicalDocInfo = (rawKey: string, rawLabel?: string) => {
    const nKey = normalizeDocKey(rawKey);
    const nLabel = normalizeDocKey(rawLabel || '');

    if (nKey.includes('PHOTO') || nKey.includes('PASSPORT') || nLabel.includes('PHOTO') || nLabel.includes('PASSPORT')) {
      return { id: 'photo', uploadKey: 'CUSTOMER PHOTOGRAPH', name: 'Passport Size Photograph' };
    }
    if (nKey.includes('SIGNATURE') || nKey.includes('SIGN') || nLabel.includes('SIGNATURE') || nLabel.includes('SIGN')) {
      return { id: 'signature', uploadKey: 'CUSTOMER SIGNATURE', name: 'Customer Signature' };
    }
    if (nKey.includes('AADHAR') || nKey.includes('AADHAAR') || nLabel.includes('AADHAR') || nLabel.includes('AADHAAR')) {
      return { id: 'aadhar', uploadKey: 'AADHAR CARD', name: 'Aadhaar Card' };
    }
    if (nKey.includes('PAN') || nLabel.includes('PAN')) {
      return { id: 'pan', uploadKey: 'PAN CARD', name: 'PAN Card' };
    }
    if (nKey.includes('SALEDEED') || nKey.includes('LANDDOC') || nKey.includes('DEED') || nLabel.includes('DEED')) {
      return { id: 'sale_deed', uploadKey: 'SALE DEED', name: 'Land Document / Sale Deed' };
    }
    if (nKey.includes('PATTA') || nLabel.includes('PATTA')) {
      return { id: 'patta', uploadKey: 'PATTA', name: 'Patta Copy' };
    }
    if (nKey.includes('FMB') || nLabel.includes('FMB')) {
      return { id: 'fmb', uploadKey: 'FMB Sketch', name: 'FMB Sketch' };
    }
    if (nKey.includes('ENCUMBRANCE') || nLabel.includes('ENCUMBRANCE') || nKey.includes('RECEIPT')) {
      return { id: 'encumbrance_certificate', uploadKey: 'ENCUMBRANCE CERTIFICATE', name: 'Encumbrance Certificate (EC)' };
    }
    if (nKey.includes('PROPERTYTAX') || nKey.includes('TAX') || nLabel.includes('TAX')) {
      return { id: 'property_tax', uploadKey: 'PROPERTY TAX', name: 'Property Tax Receipt' };
    }
    if (nKey.includes('PLAN') || nLabel.includes('PLAN')) {
      return { id: 'building_plan', uploadKey: 'BUILDING PLAN', name: 'Proposed Building Plan' };
    }
    if (nKey.includes('DRAWING') || nKey.includes('BLUEPRINT') || nLabel.includes('DRAWING')) {
      return { id: 'working_drawing', uploadKey: 'WORKING DRAWING', name: 'Working Drawing / Blueprint (Optional)' };
    }
    if (nKey.includes('OTHER') || nLabel.includes('OTHER')) {
      return { id: 'other_document', uploadKey: 'OTHER DOCUMENT', name: 'Other Supporting Document (Optional)' };
    }

    const cleanId = rawKey.toLowerCase().replace(/[^a-z0-9]+/g, '_') || nLabel.toLowerCase();
    const cleanKey = rawKey.toUpperCase().replace(/[^A-Z0-9]/g, '_') || nLabel;
    return { id: cleanId, uploadKey: cleanKey, name: rawLabel || rawKey || 'Custom Document' };
  };

  // Baseline documents (default required: false so it strictly adheres to Settings)
  const DEFAULT_DOCS = [
    { id: 'photo', uploadKey: 'CUSTOMER PHOTOGRAPH', name: 'Passport Size Photograph', required: false, description: 'Recent passport size photo of the applicant', fileName: null, status: 'Missing' },
    { id: 'signature', uploadKey: 'CUSTOMER SIGNATURE', name: 'Customer Signature', required: false, description: 'Official customer specimen signature', fileName: null, status: 'Missing' },
    { id: 'aadhar', uploadKey: 'AADHAR CARD', name: 'Aadhaar Card', required: false, description: 'Government Aadhaar identity proof of owner/applicant', fileName: null, status: 'Missing' },
    { id: 'pan', uploadKey: 'PAN CARD', name: 'PAN Card', required: false, description: 'Permanent Account Number card', fileName: null, status: 'Missing' },
    { id: 'sale_deed', uploadKey: 'SALE DEED', name: 'Land Document / Sale Deed', required: false, description: 'Registered sale deed or parent document establishing ownership', fileName: null, status: 'Missing' },
    { id: 'patta', uploadKey: 'PATTA', name: 'Patta Copy', required: false, description: 'Latest Patta/Chitta copy in applicant name', fileName: null, status: 'Missing' },
    { id: 'building_plan', uploadKey: 'BUILDING PLAN', name: 'Proposed Building Plan', required: false, description: 'Proposed architectural plan', fileName: null, status: 'Missing' },
    { id: 'fmb', uploadKey: 'FMB Sketch', name: 'FMB Sketch', required: false, description: 'Field Measurement Book sketch copy', fileName: null, status: 'Missing' },
    { id: 'encumbrance_certificate', uploadKey: 'ENCUMBRANCE CERTIFICATE', name: 'Encumbrance Certificate (EC)', required: false, description: 'Latest 15 to 30 years EC from Sub-Registrar', fileName: null, status: 'Missing' },
    { id: 'property_tax', uploadKey: 'PROPERTY TAX', name: 'Property Tax Receipt', required: false, description: 'Latest municipal / panchayat tax paid receipt', fileName: null, status: 'Missing' },
    { id: 'working_drawing', uploadKey: 'WORKING DRAWING', name: 'Working Drawing / Blueprint (Optional)', required: false, description: 'Technical drawings or CAD blueprint', fileName: null, status: 'Missing' },
    { id: 'other_document', uploadKey: 'OTHER DOCUMENT', name: 'Other Supporting Document (Optional)', required: false, description: 'Any other supporting document or certificate', fileName: null, status: 'Missing' }
  ];

  // Track uploaded documents
  const [documents, setDocuments] = useState<any[]>(DEFAULT_DOCS);

  useEffect(() => {
    const loadDocs = async () => {
      let configuredList = DEFAULT_DOCS.map(d => ({ ...d }));
      try {
        const apiUrl = getApiUrl();
        let settingsDocs: any[] = [];

        // 1. Fetch live settings from backend API
        try {
          const settingsRes = await fetch(`${apiUrl}/settings`);
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (Array.isArray(settingsData.requiredDocuments) && settingsData.requiredDocuments.length > 0) {
              settingsDocs = settingsData.requiredDocuments;
            }
          }
        } catch (_) {}

        // 2. Check localStorage fallback if backend settings empty
        if (settingsDocs.length === 0) {
          const savedChecklist = localStorage.getItem('requiredDocuments') || localStorage.getItem('admin_required_documents');
          if (savedChecklist) {
            try {
              const parsed = JSON.parse(savedChecklist);
              if (Array.isArray(parsed) && parsed.length > 0) {
                settingsDocs = parsed;
              }
            } catch (_) {}
          }
        }

        // 3. Apply settings to configuredList: exact required status, no duplicates!
        if (settingsDocs.length > 0) {
          settingsDocs.forEach((item: any) => {
            const canon = getCanonicalDocInfo(item.key, item.label);
            const existing = configuredList.find(d => d.id === canon.id || d.uploadKey === canon.uploadKey);
            if (existing) {
              if (item.required !== undefined) existing.required = Boolean(item.required);
              if (item.description) existing.description = item.description;
              if (item.label) existing.name = item.label;
            } else {
              // Brand new custom doc configured in settings (e.g. Birth cert, Fire NOC)
              configuredList.push({
                id: canon.id,
                uploadKey: canon.uploadKey,
                name: canon.name,
                required: Boolean(item.required),
                description: item.description || '',
                fileName: null,
                status: 'Missing'
              });
            }
          });
        }
      } catch (err) {
        console.warn('Error loading dynamic settings checklist in CustomerUpload:', err);
      }

      const savedDocs = localStorage.getItem(`customerDocs_${id}`);
      let currentDocs = configuredList;
      if (savedDocs) {
        try {
          const parsedSaved = JSON.parse(savedDocs);
          currentDocs = configuredList.map(cfg => {
            const existing = parsedSaved.find((p: any) => p.id === cfg.id || p.uploadKey === cfg.uploadKey || p.name.toUpperCase() === cfg.name.toUpperCase());
            if (existing) {
              return { ...cfg, ...existing, required: cfg.required };
            }
            return cfg;
          });
        } catch (e) {}
      }
      
      let reqList: string[] = [];
      const localCasesStr = localStorage.getItem('mock_saved_cases');
      if (localCasesStr) {
        try {
          const localCases = JSON.parse(localCasesStr);
          const caseData = localCases.find((c: any) => (c.application_number || c.id) === id);
          if (caseData?.requestedReuploads) reqList = caseData.requestedReuploads;
        } catch (_) {}
      }

      // Also fetch from live MongoDB API
      if (id) {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/cases/${id}`);
          if (res.ok) {
            const apiCase = await res.json();

            if (apiCase.requestedReuploads && apiCase.requestedReuploads.length > 0) {
              reqList = apiCase.requestedReuploads;
            } else if (apiCase.fullData?.requestedReuploads && apiCase.fullData.requestedReuploads.length > 0) {
              reqList = apiCase.fullData.requestedReuploads;
            }

            const caseFiles = apiCase.uploadedFiles || apiCase.fullData?.documents || {};
            if (caseFiles) {
              currentDocs = currentDocs.map((d: any) => {
                const fileEntryKey = Object.keys(caseFiles).find(k => {
                  const kCanon = getCanonicalDocInfo(k);
                  return kCanon.id === d.id || kCanon.uploadKey === d.uploadKey || normalizeDocKey(k) === normalizeDocKey(d.uploadKey) || normalizeDocKey(k) === normalizeDocKey(d.name);
                });
                if (fileEntryKey && caseFiles[fileEntryKey]) {
                  return { ...d, fileData: caseFiles[fileEntryKey], fileName: `${d.name}.jpg`, status: 'Uploaded' };
                }
                return d;
              });
            }
          }
        } catch (e) {
          console.error("Error fetching case for customer upload:", e);
        }
      }

      if (reqList.length > 0) {
        const reqCanonIds = reqList.map((r: string) => getCanonicalDocInfo(r).id);
        setRequestedDocIds(reqCanonIds);
        
        currentDocs = currentDocs.map((d: any) => {
          if (reqCanonIds.includes(d.id)) {
            return { ...d, status: 'Needs Reupload', fileName: null, fileData: null };
          }
          return d;
        });
      }
      
      setDocuments(currentDocs);
      
      const submitted = localStorage.getItem(`customerSubmitted_${id}`);
      if (submitted) {
        setIsSubmitted(true);
      }
    };
    
    loadDocs();
    window.addEventListener('storage', loadDocs);
    window.addEventListener('settingsUpdated', loadDocs);
    return () => {
      window.removeEventListener('storage', loadDocs);
      window.removeEventListener('settingsUpdated', loadDocs);
    };
  }, [id]);
  
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const triggerUpload = (docId: string) => {
    if (isUploading) return;
    const doc = documents.find(d => d.id === docId);
    if (isSubmitted && doc?.status !== 'Needs Reupload') return;
    setActiveUploadId(docId);
    fileInputRef.current?.click();
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeUploadId) {
      const file = e.target.files[0];

      const docTypeMapping: Record<string, string> = {
        'photo': 'CUSTOMER PHOTOGRAPH',
        'signature': 'CUSTOMER SIGNATURE',
        'aadhar': 'AADHAR CARD',
        'pan': 'PAN CARD',
        'sale_deed': 'SALE DEED',
        'patta': 'PATTA',
        'fmb': 'FMB',
        'building_plan': 'BUILDING PLAN'
      };
      const docType = docTypeMapping[activeUploadId] || activeUploadId.toUpperCase();

      const validation = await validateUploadFile(file, docType);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file uploaded', { duration: 6000 });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveUploadId(null);
        return;
      }

      const loadingToast = toast.loading(`Uploading ${file.name} to Cloudinary...`);
      setIsUploading(true);

      try {
        const cloudinaryUrl = await uploadFileToCloudinary(file);
        setDocuments(docs => {
            const newDocs = docs.map(doc => 
              doc.id === activeUploadId ? { 
                ...doc, 
                fileName: file.name,
                fileData: cloudinaryUrl,
                fileUrl: cloudinaryUrl,
                status: isSubmitted ? doc.status : 'Pending',
                uploadedBy: 'Customer',
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              } : doc
            );
            try {
              localStorage.setItem(`customerDocs_${id}`, JSON.stringify(newDocs));
              window.dispatchEvent(new Event('storage'));
            } catch (error) {
              console.error('Storage error:', error);
            }
            return newDocs;
          });
          toast.success(`${file.name} uploaded successfully!`, { id: loadingToast });
      } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        toast.error(`Upload failed: ${error.message}`, { id: loadingToast, duration: 5000 });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveUploadId(null);
      }
    } else {
      setActiveUploadId(null);
    }
  };

  const addNotification = (title: string, message: string) => {
    const stored = localStorage.getItem('mock_notifications');
    const notifs = stored ? JSON.parse(stored) : [];
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'Just now',
      read: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem('mock_notifications', JSON.stringify(notifs));
  };

  const handleReuploadSubmit = async () => {
    const newDocs = documents.map(doc => {
      if (doc.status === 'Needs Reupload' && doc.fileName) {
        return { ...doc, status: 'Pending' };
      }
      return doc;
    });
    setDocuments(newDocs);
    localStorage.setItem(`customerDocs_${id}`, JSON.stringify(newDocs));
    addNotification('Document Uploaded', `Customer reuploaded requested documents for application ${id}.`);
    window.dispatchEvent(new Event('storage'));

    const apiUrl = getApiUrl();
    if (id) {
      try {
        const docMapping: any = {
          'sale_deed': 'SALE DEED',
          'patta': 'PATTA',
          'fmb': 'FMB',
          'pan': 'PAN CARD',
          'aadhar': 'AADHAR CARD',
          'photo': 'CUSTOMER PHOTOGRAPH',
          'signature': 'CUSTOMER SIGNATURE',
          'building_plan': 'BUILDING PLAN'
        };
        const mappedFiles: any = {};
        newDocs.forEach((d: any) => {
          if (d.fileData) {
            const docKey = d.uploadKey || docMapping[d.id] || d.name.toUpperCase();
            mappedFiles[docKey] = d.fileData;
          }
        });

        // Also update local storage
        const localCasesStr = localStorage.getItem('mock_saved_cases');
        if (localCasesStr) {
          const localCases = JSON.parse(localCasesStr);
          const cIdx = localCases.findIndex((c: any) => (c.application_number || c.id) === id);
          if (cIdx !== -1) {
            localCases[cIdx].status = 'DOCUMENTS_VERIFICATION';
            localCases[cIdx].requestedReuploads = [];
            localCases[cIdx].uploadedFiles = { ...localCases[cIdx].uploadedFiles, ...mappedFiles };
            localStorage.setItem('mock_saved_cases', JSON.stringify(localCases));
          }
        }

        await fetch(`${apiUrl}/cases/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'DOCUMENTS_VERIFICATION',
            requestedReuploads: [],
            uploadedFiles: mappedFiles,
            linkTracking: { customerUploaded: true, uploadDate: new Date().toISOString() }
          })
        });
      } catch (err) {
        console.error("Failed to sync customer reupload to MongoDB API:", err);
      }
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = () => {
    // If reupload mode is active, verify all requested items have files
    if (requestedDocIds.length > 0) {
      const missingReuploads = documents.filter(doc => requestedDocIds.includes(doc.id) && !doc.fileName && !doc.fileData);
      if (missingReuploads.length > 0) {
        toast.error(`Please upload all requested documents (${missingReuploads.map(d => d.name).join(', ')}) before submitting.`);
        return;
      }
      handleReuploadSubmit();
      return;
    }

    // Dynamic mandatory check based on checklist configuration
    const missingMandatory = documents.filter(doc => doc.required && !doc.fileName && !doc.fileData);
    if (missingMandatory.length > 0) {
      toast.error(`Required documents missing: ${missingMandatory.map(d => d.name).join(', ')}. Please upload all mandatory documents before submitting.`);
      return;
    }
    
    setShowConfirmModal(true);
  };

  const confirmSubmission = async () => {
    setShowConfirmModal(false);
    setIsSubmitted(true);
    
    localStorage.setItem(`customerSubmitted_${id}`, 'true');
    localStorage.setItem(`customerDocs_${id}`, JSON.stringify(documents));
    addNotification('New Application', `Customer submitted documents for application ${id}.`);
    window.dispatchEvent(new Event('storage'));

    const apiUrl = getApiUrl();
    if (id) {
      try {
        const docMapping: any = {
          'sale_deed': 'SALE DEED',
          'patta': 'PATTA',
          'fmb': 'FMB',
          'pan': 'PAN CARD',
          'aadhar': 'AADHAR CARD',
          'photo': 'CUSTOMER PHOTOGRAPH',
          'signature': 'CUSTOMER SIGNATURE',
          'building_plan': 'BUILDING PLAN'
        };
        const mappedFiles: any = {};
        documents.forEach((d: any) => {
          if (d.fileData) {
            const docKey = d.uploadKey || docMapping[d.id] || d.name.toUpperCase();
            mappedFiles[docKey] = d.fileData;
          }
        });
        await fetch(`${apiUrl}/cases/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'DOCUMENTS_VERIFICATION',
            uploadedFiles: mappedFiles,
            requestedReuploads: [],
            linkTracking: { customerUploaded: true, uploadDate: new Date().toISOString() }
          })
        });
      } catch (err) {
        console.error("Failed to sync customer submission to MongoDB API:", err);
      }
    }
  };

  const [viewingDoc, setViewingDoc] = useState<{name: string, fileData?: string} | null>(null);



  const handleView = (doc: any) => {
    setViewingDoc({ name: doc.name, fileData: doc.fileData || doc.url || doc.file });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <img src="/assets/logo.jpeg" alt="C.B. Building Approvals Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0, letterSpacing: '-0.025em' }}>
              C.B. Building Approvals
            </h1>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Secure Document Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Application Reference: <strong style={{ color: 'var(--primary-dark)' }}>{id}</strong></p>
        </div>

        {isSubmitted && documents.some(d => d.status === 'Needs Reupload') && (
          <div style={{ backgroundColor: 'rgba(214, 167, 86, 0.1)', border: '1px solid var(--warning-gold)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <AlertCircle size={24} color="var(--warning-gold)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: '0 0 0.25rem 0' }}>Action Required: Reupload Documents</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Some of your documents need to be reuploaded. Please check the list below and provide the corrected files.</p>
            </div>
          </div>
        )}

        {isSubmitted && !documents.some(d => d.status === 'Needs Reupload') && (
          <div style={{ backgroundColor: 'rgba(34, 160, 107, 0.1)', border: '1px solid var(--success-green)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <ShieldCheck size={24} color="var(--success-green)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: '0 0 0.25rem 0' }}>Documents Submitted Successfully</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Your documents have been securely transmitted to our agency. You can no longer upload or modify files, but you may view or download your submitted documents below.</p>
            </div>
          </div>
        )}

        {!isSubmitted && (
          <div style={{ backgroundColor: 'rgba(30, 58, 138, 0.05)', border: '1px solid rgba(11, 99, 206, 0.2)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <AlertCircle size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: '0 0 0.25rem 0' }}>Action Required</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Please upload the requested documents below. All mandatory documents marked with <strong>REQUIRED</strong> must be provided before final submission.</p>
            </div>
          </div>
        )}

        {/* Upload List */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
          {documents.filter(doc => !['site_inspection_report', 'govt_approval'].includes(doc.id) && (requestedDocIds.length === 0 || requestedDocIds.includes(doc.id))).map((doc, index, array) => (
            <div key={doc.id} style={{ padding: '1.5rem', borderBottom: index < array.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', backgroundColor: doc.status === 'Needs Reupload' ? 'rgba(214, 167, 86, 0.1)' : (doc.fileName || doc.file) ? 'rgba(34, 160, 107, 0.1)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.status === 'Needs Reupload' ? 'var(--warning-gold)' : (doc.fileName || doc.file) ? 'var(--success-green)' : 'var(--text-secondary)' }}>
                  {(doc.fileName || doc.file) && doc.status !== 'Needs Reupload' ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-dark)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {doc.name}
                    {doc.required ? (
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 800 }}>REQUIRED</span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>OPTIONAL</span>
                    )}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: doc.status === 'Needs Reupload' ? 'var(--warning-gold)' : (doc.fileName || doc.file) ? 'var(--success-green)' : 'var(--text-secondary)', margin: 0 }}>
                    {doc.status === 'Needs Reupload' ? 'Reupload Requested' : (doc.fileName || doc.file) ? `Uploaded: ${doc.fileName || doc.file}` : 'Pending Upload'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {(doc.fileName || doc.file || doc.fileData) && (
                  <button 
                    type="button"
                    onClick={() => handleView(doc)} 
                    style={{ 
                      padding: '0.5rem 0.85rem', 
                      borderRadius: '0.5rem', 
                      border: '1px solid var(--border-color)', 
                      backgroundColor: 'var(--bg-surface)', 
                      color: 'var(--primary-dark)', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem' 
                    }}
                  >
                    <FileText size={15} /> View
                  </button>
                )}

                {(!isSubmitted || doc.status === 'Needs Reupload') && (
                  <button 
                    type="button"
                    onClick={() => triggerUpload(doc.id)}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '0.5rem', 
                      border: (doc.fileName || doc.file || doc.fileData) ? '1px solid var(--border-color)' : 'none', 
                      backgroundColor: (doc.fileName || doc.file || doc.fileData) ? 'white' : 'var(--primary)', 
                      color: (doc.fileName || doc.file || doc.fileData) ? 'var(--primary-dark)' : 'white', 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem' 
                    }}
                  >
                    <Upload size={15} /> {doc.status === 'Needs Reupload' ? 'Reupload' : (doc.fileName || doc.file || doc.fileData) ? 'Replace' : 'Upload'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* Submit Button */}
        {!isSubmitted && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSubmit}
              className="btn-primary" 
              style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ShieldCheck size={20} /> Submit All Documents
            </button>
          </div>
        )}

        {/* Submit Reuploads Button */}
        {isSubmitted && documents.some(d => d.status === 'Needs Reupload') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              onClick={handleReuploadSubmit}
              className="btn-primary" 
              style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--warning-gold)', borderColor: 'var(--warning-gold)' }}
            >
              <ShieldCheck size={20} /> Submit Reuploaded Documents
            </button>
          </div>
        )}

      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative' }}>
            <button onClick={() => setShowConfirmModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(214, 167, 86, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-gold)', flexShrink: 0 }}>
                <HelpCircle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Confirm Submission</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Are you sure you want to submit your documents now?</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--primary-dark)' }}>
              <strong>Important:</strong> You will not be able to change, delete, or upload more documents after submitting. Please verify all files are correct.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--primary-dark)', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={confirmSubmission} className="btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                Yes, Submit Documents
              </button>
            </div>
          </div>
        </div>
      )}


      {/* View Document Modal */}
      {viewingDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '2rem' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '0.75rem', width: '100%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>{viewingDoc.name}</h3>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f1f5f9', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              {viewingDoc.fileData ? (
                viewingDoc.fileData.startsWith('data:image/') || viewingDoc.fileData.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || (viewingDoc.fileData.includes('cloudinary.com') && !viewingDoc.fileData.endsWith('.pdf')) ? (
                  <img src={viewingDoc.fileData} alt={viewingDoc.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : viewingDoc.fileData.startsWith('data:application/pdf') || viewingDoc.fileData.endsWith('.pdf') ? (
                  <iframe src={viewingDoc.fileData} title={viewingDoc.name} style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <a href={viewingDoc.fileData} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                      <FileText size={18} /> Open Document
                    </a>
                  </div>
                )
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No file data available.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerUpload;
