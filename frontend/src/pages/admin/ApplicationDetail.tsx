import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Building, FileText, Upload, CheckCircle, X, Save, Send, Download, AlertTriangle, RotateCcw, Eye, Archive, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { uploadFileToCloudinary, getApiUrl } from '../../config/api';
import { validateUploadFile } from '../../utils/imageValidation';
import { recentApplications } from '../../data/mockData';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isEditMode = searchParams.get('edit') === 'true';
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isForbidden, setIsForbidden] = useState(false);

  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/users`);
        if (res.ok) {
          const data = await res.json();
          setStaffList(data.filter((s: any) => s.status === 'Active' && s.role === 'STAFF'));
        }
      } catch (e) {
        console.error('Failed to fetch staff list', e);
      }
    };
    fetchStaff();
  }, []);

  const loggedInUser = localStorage.getItem('loggedInUser') || 'Admin';
  const isEmployee = loggedInUser !== 'Admin';

  const defaultFormData = {
    // Page 1: Services & Personal Details
    serviceType: '',
    customerName: '',
    fatherName: '',
    dob: '',
    mobile: '',
    email: '',
    altMobile: '',
    aadhar: '',
    pan: '',
    residentialAddress: { houseNo: '', streetName: '', area: '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '', accomodationType: 'Own', yearsResiding: '' },
    permanentAddress: { sameAsResidential: true, houseNo: '', streetName: '', area: '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '' },
    staff: isEmployee ? loggedInUser : '',
    
    // Page 2: Property Details
    propertyDetails: { surveyNo: '', pattaNo: '', dno: '', streetName: '', village: '', panchayat: '', city: '', taluk: '', pincode: '', state: '', landmark: '' },
    referenceDetails: { source: '', name: '', mobile: '' },
    
    // Page 3: Fees Details
    feesAmount: '',
    feeNotes: '',
  };

  const sanitizeFormData = (data: any) => {
    if (!data) return defaultFormData;
    
    let resAddr = data.residentialAddress;
    if (typeof resAddr === 'string') {
      resAddr = { houseNo: resAddr, streetName: '', area: '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '', accomodationType: 'Own', yearsResiding: '' };
    }
    
    let permAddr = data.permanentAddress;
    if (!permAddr) {
      permAddr = { sameAsResidential: true, houseNo: '', streetName: '', area: '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '' };
    } else if (typeof permAddr === 'string') {
      permAddr = { sameAsResidential: true, houseNo: permAddr, streetName: '', area: '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '' };
    }

    return {
      ...defaultFormData,
      ...data,
      residentialAddress: {
        ...defaultFormData.residentialAddress,
        ...(resAddr || {})
      },
      permanentAddress: {
        ...defaultFormData.permanentAddress,
        ...permAddr,
        sameAsResidential: permAddr.sameAsResidential !== undefined ? Boolean(permAddr.sameAsResidential) : true
      },
      propertyDetails: {
        ...defaultFormData.propertyDetails,
        ...(data.propertyDetails || {})
      },
      referenceDetails: {
        ...defaultFormData.referenceDetails,
        ...(data.referenceDetails || {})
      }
    };
  };

  const [applicationStatus, setApplicationStatus] = useState<string>(() => {
    if (id) {
      const existingStr = localStorage.getItem('mock_saved_cases');
      if (existingStr) {
        const existing = JSON.parse(existingStr);
        const app = existing.find((a: any) => a.id === id || a.application_number === id);
        if (app && app.status) {
          return app.status;
        }
      }
      const apiApp = recentApplications.find((a: any) => a.id === id || a.application_number === id);
      if (apiApp && apiApp.status) return apiApp.status;
    }
    return 'PENDING_DOCUMENTS';
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    const tabParam = params.get('tab');
    if (stepParam) return Math.min(4, Math.max(1, parseInt(stepParam, 10)));
    if (tabParam === 'documents' || tabParam === 'docs') return 4;
    const saved = localStorage.getItem('newApp_currentStep');
    return saved && !id ? parseInt(saved, 10) : 1;
  });

  React.useEffect(() => {
    const stepParam = searchParams.get('step');
    const tabParam = searchParams.get('tab');
    if (stepParam) setCurrentStep(Math.min(4, Math.max(1, parseInt(stepParam, 10))));
    else if (tabParam === 'documents' || tabParam === 'docs') setCurrentStep(4);
  }, [location.search, searchParams]);
  const totalSteps = 4;
  const [isUploading, setIsUploading] = useState(false);
  const [isSaveMenuOpen, setSaveMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPartialSaveModalOpen, setIsPartialSaveModalOpen] = useState(false);
  const [saveReason, setSaveReason] = useState('Documents pending');
  const [docUploadType, setDocUploadType] = useState('CUSTOMER PHOTOGRAPH');
  const [modalTab, setModalTab] = useState<'upload' | 'view'>('upload');
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedForReupload, setSelectedForReupload] = useState<string[]>([]);
  const [reuploadNote, setReuploadNote] = useState('');
  const [isSendingReupload, setIsSendingReupload] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{
    'CUSTOMER PHOTOGRAPH'?: string;
    'CUSTOMER SIGNATURE'?: string;
    'AADHAR CARD'?: string;
    'PAN CARD'?: string;
    'LAND DOCUMENT'?: string;
    'SALE DEED'?: string;
    'PATTA'?: string;
    'FMB'?: string;
    'PROPERTY SIGNATURE'?: string;
    'BUILDING PLAN'?: string;
    'RECEIPT'?: string;
    'FINAL_APPROVAL'?: string;
    receiptNumber?: string;
    username?: string;
    password?: string;
  }>(() => {
    if (id) {
      const existingStr = localStorage.getItem('mock_saved_cases');
      if (existingStr) {
        const existing = JSON.parse(existingStr);
        const app = existing.find((a: any) => a.id === id || a.application_number === id);
        if (app && app.uploadedFiles) {
          return app.uploadedFiles;
        }
      }
    }
    return {};
  });

  React.useEffect(() => {
    if (!id || location.pathname.endsWith('/new')) {
      localStorage.removeItem('newApp_formData');
      localStorage.removeItem('newApp_uploadedFiles');
      localStorage.removeItem('newApp_currentStep');
    }
  }, [id, location.pathname]);

  React.useEffect(() => {
    if (id) {
      const loadCustomerDocs = () => {
        const savedDocs = localStorage.getItem(`customerDocs_${id}`);
        if (savedDocs) {
          try {
            const parsed = JSON.parse(savedDocs);
            const mappedDocs: any = {};
            parsed.forEach((d: any) => {
              const fileVal = d.fileData || d.url || d.file;
              if (fileVal) {
                if (d.id === 'sale_deed') mappedDocs['SALE DEED'] = fileVal;
                if (d.id === 'patta') mappedDocs['PATTA'] = fileVal;
                if (d.id === 'fmb') mappedDocs['FMB'] = fileVal;
                if (d.id === 'pan') mappedDocs['PAN CARD'] = fileVal;
                if (d.id === 'aadhar') mappedDocs['AADHAR CARD'] = fileVal;
                if (d.id === 'photo') mappedDocs['CUSTOMER PHOTOGRAPH'] = fileVal;
                if (d.id === 'signature') mappedDocs['CUSTOMER SIGNATURE'] = fileVal;
                if (d.id === 'building_plan') mappedDocs['BUILDING PLAN'] = fileVal;
              }
            });
            
            if (Object.keys(mappedDocs).length > 0) {
              setUploadedFiles((prev: any) => ({ ...prev, ...mappedDocs }));
            }
          } catch (e) {
            console.error('Error parsing customer docs', e);
          }
        }
      };
      
      const loadCaseFromApi = async () => {
        try {
          const apiUrl = getApiUrl();
          const userRole = localStorage.getItem('userRole') || (isEmployee ? 'STAFF' : 'ADMIN');
          const staffIdVal = localStorage.getItem('staffId') || '';
          const res = await fetch(`${apiUrl}/cases/${id}`, {
            headers: {
              'x-user-role': userRole,
              'x-user-name': loggedInUser,
              'x-staff-id': staffIdVal
            }
          });
          if (res.status === 403) {
            setIsForbidden(true);
            return;
          }
          if (res.ok) {
            const c = await res.json();
            if (c.status) {
              setApplicationStatus(c.status);
            }
            if (c.uploadedFiles) {
              setUploadedFiles(prev => ({ ...prev, ...c.uploadedFiles }));
            }
            if (c.fullData) {
              setFormData((prev: any) => sanitizeFormData({ ...prev, ...c.fullData }));
            } else if (c.property) {
              setFormData((prev: any) => sanitizeFormData({
                ...prev,
                customerName: c.property.owner_name || prev.customerName,
                mobile: c.property.owner_phone || prev.mobile,
                email: c.property.owner_email || prev.email,
                staff: c.assigned_staff?.name || prev.staff,
                propertyDetails: {
                  ...prev.propertyDetails,
                  dno: c.property.address || '',
                  village: c.property.village || '',
                  taluk: c.property.taluk || '',
                  surveyNo: c.property.survey_number || ''
                }
              }));
            }
          }
        } catch (e) {
          console.error('Error fetching case from MongoDB API:', e);
        }
      };

      loadCustomerDocs();
      loadCaseFromApi();
      window.addEventListener('storage', loadCustomerDocs);
      return () => window.removeEventListener('storage', loadCustomerDocs);
    }
  }, [id]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Strict image & document verification
      const validation = await validateUploadFile(file, docUploadType);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file uploaded', { duration: 6000 });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsUploading(true);
      const loadingToast = toast.loading(`Uploading ${file.name}...`);
      
      try {
        const imageUrl = await uploadFileToCloudinary(file);
        const newUploadedFiles = { ...uploadedFiles, [docUploadType]: imageUrl };
        setUploadedFiles(newUploadedFiles);
          
          if (id) {
            const apiUrl = getApiUrl();
            try {
              fetch(`${apiUrl}/cases/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadedFiles: newUploadedFiles })
              }).catch(err => console.error("Failed to sync uploaded file to MongoDB:", err));
            } catch (err) {
              console.error(err);
            }

            const existingStr = localStorage.getItem('mock_saved_cases');
            if (existingStr) {
              const existing = JSON.parse(existingStr);
              const index = existing.findIndex((c: any) => c.id === id);
              if (index !== -1) {
                existing[index].uploadedFiles = newUploadedFiles;
                if (existing[index].fullData) {
                  existing[index].fullData.uploadedFiles = newUploadedFiles;
                }
                localStorage.setItem('mock_saved_cases', JSON.stringify(existing));
              }
            }
          }
          
          toast.success(`${file.name} attached for ${docUploadType}`, { id: loadingToast });
      } catch (error: any) {
        console.error("Cloudinary upload error:", error);
        toast.error(`Upload failed: ${error.message}`, { id: loadingToast, duration: 5000 });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const [formData, setFormData] = useState(() => {
    // If we have an ID, load that data instead
    if (id) {
      const existingStr = localStorage.getItem('mock_saved_cases');
      if (existingStr) {
        try {
          const existing = JSON.parse(existingStr);
          const app = existing.find((a: any) => a.id === id);
          if (app && app.fullData) {
            return sanitizeFormData(app.fullData);
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      // Fallback to mock API data
      const apiApp = recentApplications.find((a: any) => a.id === id);
      if (apiApp) {
        return sanitizeFormData({
          serviceType: apiApp.approval_type === 'BUILDING_PLAN_APPROVAL' ? 'building' : 'plan',
          customerName: apiApp.customer || '',
          residentialAddress: { houseNo: '', streetName: '', area: apiApp.location || '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '', accomodationType: 'Own', yearsResiding: '' },
          staff: apiApp.staff || '',
        });
      }
    }
    return defaultFormData;
  });

  React.useEffect(() => {
    if (!id) {
      try {
        localStorage.setItem('newApp_currentStep', currentStep.toString());
      } catch (e) {
        console.error("Storage quota exceeded", e);
      }
    }
  }, [currentStep, id]);

  React.useEffect(() => {
    if (!id) {
      try {
        localStorage.setItem('newApp_uploadedFiles', JSON.stringify(uploadedFiles));
      } catch (e) {
        console.error("Storage quota exceeded", e);
        toast.error("Storage limit reached! Please clear previous drafts or compress your images.");
      }
    }
  }, [uploadedFiles, id]);

  React.useEffect(() => {
    if (!id) {
      try {
        localStorage.setItem('newApp_formData', JSON.stringify(formData));
      } catch (e) {
        console.error("Storage quota exceeded", e);
      }
    } else {
      try {
        const existingStr = localStorage.getItem('mock_saved_cases');
        if (existingStr) {
          const existing = JSON.parse(existingStr);
          const index = existing.findIndex((c: any) => c.id === id);
          if (index !== -1) {
            existing[index].fullData = formData;
            localStorage.setItem('mock_saved_cases', JSON.stringify(existing));
          }
        }
      } catch (e) {
        console.error("Storage quota exceeded", e);
      }
    }
  }, [formData, id]);

  const checkAllDocumentsUploaded = () => {
    return uploadedFiles['CUSTOMER PHOTOGRAPH'] && 
           uploadedFiles['CUSTOMER SIGNATURE'] &&
           uploadedFiles['AADHAR CARD'] && 
           uploadedFiles['PAN CARD'] && 
           uploadedFiles['LAND DOCUMENT'] &&
           uploadedFiles['SALE DEED'] &&
           uploadedFiles['PATTA'] &&
           uploadedFiles['FMB'] &&
           uploadedFiles['PROPERTY SIGNATURE'] &&
           uploadedFiles['BUILDING PLAN'];
  };

  const saveApplicationData = async (isPartial: boolean, reason?: string) => {
    try {
      const apiUrl = getApiUrl();
      
      const typeMap: Record<string, string> = {
        'building': 'BUILDING_PLAN_APPROVAL',
        'plan': 'LAYOUT_APPROVAL',
        'occupancy': 'COMPLETION_CERTIFICATE',
        'regularisation': 'PATTA_TRANSFER'
      };

      let newStatus = applicationStatus;
      if (!isPartial) {
        if (applicationStatus === 'PENDING_DOCUMENTS' || applicationStatus === 'Draft' || applicationStatus === 'INTAKE') {
           if (checkAllDocumentsUploaded()) {
              newStatus = 'DOCUMENTS_VERIFICATION';
           } else {
              newStatus = 'PENDING_DOCUMENTS';
           }
        }
      } else {
        if (applicationStatus === 'NEW' || !applicationStatus) newStatus = 'PENDING_DOCUMENTS';
      }
      setApplicationStatus(newStatus);
      
      const existingStr = localStorage.getItem('mock_saved_cases');
      let existing = existingStr ? JSON.parse(existingStr) : [];
      
      let finalAppNumber = id || '';
      if (!id) {
        let nextAppNum = 7001;
        let existingApi = [];
        try {
          const allCasesRes = await fetch(`${apiUrl}/cases`);
          if (allCasesRes.ok) existingApi = await allCasesRes.json();
        } catch (e) {
          console.error(e);
        }
        const allCases = [...existing, ...existingApi];
        allCases.forEach((c: any) => {
          const appNum = c.application_number || '';
          if (appNum.startsWith('APP-')) {
            const num = parseInt(appNum.replace('APP-', ''), 10);
            if (!isNaN(num) && num >= nextAppNum) nextAppNum = num + 1;
          } else if (appNum) {
            const num = parseInt(appNum, 10);
            if (!isNaN(num) && num >= nextAppNum) nextAppNum = num + 1;
          }
        });
        finalAppNumber = `${nextAppNum}`;
      }

      const mockCase = {
        id: finalAppNumber,
        application_number: finalAppNumber,
        property: {
          owner_name: formData.customerName || 'Draft Owner',
          owner_phone: formData.mobile || '',
          jurisdiction: 'DTCP',
          village: formData.residentialAddress.area || ''
        },
        fullData: formData,
        uploadedFiles: uploadedFiles,
        approval_type: typeMap[formData.serviceType] || 'Draft',
        status: newStatus,
        assigned_staff: { name: formData.staff },
        created_at: new Date().toISOString(),
        reason: reason || ''
      };
      
      if (id) {
        const index = existing.findIndex((c: any) => c.id === id);
        if (index !== -1) {
          existing[index] = { ...existing[index], ...mockCase };
        } else {
          existing = [mockCase, ...existing];
        }
      } else {
        existing = [mockCase, ...existing];
      }
      localStorage.setItem('mock_saved_cases', JSON.stringify(existing));

      if (!id) {
        localStorage.removeItem('newApp_formData');
        localStorage.removeItem('newApp_currentStep');
        localStorage.removeItem('newApp_uploadedFiles');
      }

      const payload = {
        application_number: finalAppNumber,
        property: {
          [id ? 'update' : 'create']: {
            owner_name: formData.customerName || 'Draft Owner',
            owner_phone: formData.mobile || '0000000000',
            owner_email: formData.email || '',
            address: `${formData.propertyDetails?.dno || ''} ${formData.propertyDetails?.streetName || ''}`.trim() || formData.residentialAddress?.area || '',
            village: formData.propertyDetails?.village || formData.residentialAddress?.area || 'Unknown',
            taluk: formData.propertyDetails?.taluk || formData.residentialAddress?.taluk || 'Unknown',
            survey_number: formData.propertyDetails?.surveyNo || 'TBD',
            jurisdiction: formData.propertyDetails?.panchayat || 'DTCP'
          }
        },
        approval_type: typeMap[formData.serviceType] || 'BUILDING_PLAN_APPROVAL',
        status: isPartial ? 'Draft' : newStatus,
        assigned_staff: formData.staff ? { name: formData.staff.split(' — ')[0] } : undefined,
        fullData: formData,
        uploadedFiles: uploadedFiles,
        reason: reason || ''
      };
      
      const endpoint = id ? `${apiUrl}/cases/${id}` : `${apiUrl}/cases`;
      const method = id ? 'PUT' : 'POST';
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handlePartialSave = async () => {
    await saveApplicationData(true, saveReason);
    toast.success(`Application partially saved: ${saveReason}`);
    setIsPartialSaveModalOpen(false);
    if (isEmployee) {
      navigate('/employee/applications');
    } else {
      navigate('/admin/applications');
    }
  };

  const handleNext = () => {
    let errors: string[] = [];
    
    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.serviceType) errors.push('serviceType');
      if (!formData.staff) errors.push('staff');
      if (!formData.customerName) errors.push('customerName');
      if (!formData.fatherName) errors.push('fatherName');
      if (!formData.dob) errors.push('dob');
      if (!formData.mobile) errors.push('mobile');
      if (!formData.email) errors.push('email');
      if (!formData.aadhar) errors.push('aadhar');
      if (!formData.pan) errors.push('pan');
      
      if (!formData.residentialAddress?.houseNo) errors.push('res_houseNo');
      if (!formData.residentialAddress?.streetName) errors.push('res_streetName');
      if (!formData.residentialAddress?.city) errors.push('res_city');
      if (!formData.residentialAddress?.state) errors.push('res_state');
      
      const isSameAsRes = formData.permanentAddress?.sameAsResidential ?? true;
      const perm = isSameAsRes ? (formData.residentialAddress || {}) : (formData.permanentAddress || {});
      if (!perm.houseNo) errors.push('perm_houseNo');
      if (!perm.streetName) errors.push('perm_streetName');
      if (!perm.city) errors.push('perm_city');
      if (!perm.state) errors.push('perm_state');
    }
    
    // Validation for Step 2
    if (currentStep === 2) {
      if (!formData.propertyDetails?.surveyNo) errors.push('prop_surveyNo');
      if (!formData.propertyDetails?.pattaNo) errors.push('prop_pattaNo');
    }

    // Validation for Step 3
    if (currentStep === 3) {
      if (!formData.feesAmount) errors.push('feesAmount');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      toast.error("Please fill all mandatory fields (highlighted in red) to proceed.");
      return;
    }

    setFormErrors([]);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Personal Details' },
      { num: 2, label: 'Property Details' },
      { num: 3, label: 'Fees Details' },
      { num: 4, label: 'Uploaded Documents' },
    ];

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div 
              onClick={() => setCurrentStep(step.num)}
              role="button"
              tabIndex={0}
              title={`Click to switch to Step ${step.num}: ${step.label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '0.4rem 0.85rem',
                borderRadius: '2rem',
                backgroundColor: currentStep === step.num ? 'rgba(30, 58, 138, 0.1)' : 'transparent',
                border: currentStep === step.num ? '1px solid var(--primary)' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                width: '30px', height: '30px', borderRadius: '50%', 
                backgroundColor: currentStep >= step.num ? 'var(--primary)' : 'var(--bg-secondary)',
                color: currentStep >= step.num ? 'white' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem', 
                border: currentStep >= step.num ? 'none' : '1px solid var(--border-color)',
                flexShrink: 0
              }}>
                {step.num}
              </div>
              <span style={{ 
                fontSize: '0.8125rem', 
                fontWeight: currentStep === step.num ? 700 : 500, 
                color: currentStep === step.num ? 'var(--primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ 
                width: '24px', height: '2px', 
                backgroundColor: currentStep > step.num ? 'var(--primary)' : 'var(--border-color)',
                borderRadius: '2px'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const getInputStyle = (fieldName: string, value: any) => {
    const hasError = formErrors.includes(fieldName) && !value;
    return { 
      width: '100%', 
      padding: '0.5rem', 
      border: 'none', 
      borderBottom: hasError ? '2px solid #ef4444' : '1px solid var(--border-color)', 
      backgroundColor: hasError ? '#fef2f2' : 'transparent',
      outline: 'none',
      transition: 'all 0.2s ease-in-out'
    };
  };

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Section - Service Details */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--primary)" /> Service Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Service Type *</label>
            <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} style={getInputStyle('serviceType', formData.serviceType)}>
              <option value="">Select Service</option>
              <option value="building">Building Approval</option>
              <option value="plan">Plan Approval</option>
              <option value="occupancy">Occupancy Certificate</option>
              <option value="regularisation">Regularisation</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Source Details (Assigned Employee) *</label>
            {isEmployee ? (
              <input type="text" value={loggedInUser} disabled style={{ ...getInputStyle('staff', loggedInUser), backgroundColor: 'transparent', color: '#64748b' }} />
            ) : (
              <select value={formData.staff} onChange={e => setFormData({...formData, staff: e.target.value})} style={getInputStyle('staff', formData.staff)}>
                <option value="">Select Employee</option>
                {staffList.length > 0 ? (
                  staffList.map((s: any) => (
                    <option key={s.id} value={s.name}>{s.name} — Staff Member</option>
                  ))
                ) : (
                  <option value="" disabled>No staff available</option>
                )}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Section - Personal Details */}
      <div className="card" style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 500px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" /> Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Customer Name *</label>
              <input type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Full name" style={getInputStyle('customerName', formData.customerName)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Father Name *</label>
              <input type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} placeholder="Father's name" style={getInputStyle('fatherName', formData.fatherName)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Date of Birth *</label>
              <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} style={getInputStyle('dob', formData.dob)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Mobile Number *</label>
              <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="+91" style={getInputStyle('mobile', formData.mobile)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Alternative Number (Optional)</label>
              <input type="tel" value={formData.altMobile} onChange={e => setFormData({...formData, altMobile: e.target.value})} placeholder="+91" style={getInputStyle('altMobile', formData.altMobile)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Aadhar Number *</label>
              <input type="text" value={formData.aadhar} onChange={e => setFormData({...formData, aadhar: e.target.value})} placeholder="12-digit number" style={getInputStyle('aadhar', formData.aadhar)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>PAN Number *</label>
              <input type="text" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} placeholder="PAN number" style={getInputStyle('pan', formData.pan)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Email ID *</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email address" style={getInputStyle('email', formData.email)} />
            </div>
          </div>
        </div>

        {/* Photo & Signature Upload Area */}
        <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '100%', position: 'relative', marginTop: '2rem' }}>
            <div style={{ width: '100%', aspectRatio: '3/4', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
              {uploadedFiles['CUSTOMER PHOTOGRAPH'] ? (
                <img src={uploadedFiles['CUSTOMER PHOTOGRAPH']} alt="Customer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={60} color="#cbd5e1" />
              )}
            </div>
            {/* Top Right Upload Icons */}
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
              <button 
                onClick={(e) => { e.preventDefault(); setDocUploadType('CUSTOMER PHOTOGRAPH'); setIsUploadModalOpen(true); }}
                title="Upload Customer Photo" 
                style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.4rem', color: 'var(--primary)', cursor: 'pointer', display: 'flex', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <Upload size={18} />
              </button>
            </div>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Customer Photo *</div>

          <div style={{ width: '100%', position: 'relative', marginTop: '0.5rem' }}>
            <div style={{ width: '100%', aspectRatio: '2/1', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
              {uploadedFiles['CUSTOMER SIGNATURE'] ? (
                <img src={uploadedFiles['CUSTOMER SIGNATURE']} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Signature</span>
              )}
            </div>
            {/* Top Right Upload Icon */}
            <button 
              onClick={(e) => { e.preventDefault(); setDocUploadType('CUSTOMER SIGNATURE'); setIsUploadModalOpen(true); }}
              title="Upload Customer Signature" 
              style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.4rem', color: 'var(--primary)', cursor: 'pointer', display: 'flex', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <Upload size={14} />
            </button>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Customer Signature *</div>
        </div>
      </div>

      {/* Address Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={20} color="var(--primary)" /> Address Details
        </h3>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Correspondence Address */}
          <div style={{ flex: 1, minWidth: '350px', backgroundColor: 'transparent', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Correspondence Address *</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Dno</label>
                <input type="text" value={formData.residentialAddress.houseNo} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, houseNo: e.target.value}})} style={getInputStyle('res_houseNo', formData.residentialAddress.houseNo)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Street Name</label>
                <input type="text" value={formData.residentialAddress.streetName} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, streetName: e.target.value}})} style={getInputStyle('res_streetName', formData.residentialAddress.streetName)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Area</label>
                <input type="text" value={formData.residentialAddress.area} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, area: e.target.value}})} style={getInputStyle('res_area', formData.residentialAddress.area)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City</label>
                <input type="text" value={formData.residentialAddress.city} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, city: e.target.value}})} style={getInputStyle('res_city', formData.residentialAddress.city)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk/District</label>
                <input type="text" value={formData.residentialAddress.taluk} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, taluk: e.target.value}})} style={getInputStyle('res_taluk', formData.residentialAddress.taluk)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PinCode</label>
                <input type="text" value={formData.residentialAddress.pincode} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, pincode: e.target.value}})} style={getInputStyle('res_pincode', formData.residentialAddress.pincode)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>State</label>
                <input type="text" value={formData.residentialAddress.state} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, state: e.target.value}})} style={getInputStyle('res_state', formData.residentialAddress.state)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Landmark</label>
                <input type="text" value={formData.residentialAddress.landmark} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, landmark: e.target.value}})} style={getInputStyle('res_landmark', formData.residentialAddress.landmark)} />
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          {(() => {
            const isSameAsRes = formData.permanentAddress?.sameAsResidential ?? true;
            const resAddr = formData.residentialAddress || defaultFormData.residentialAddress;
            const permAddr = formData.permanentAddress || defaultFormData.permanentAddress;
            
            return (
              <div style={{ flex: 1, minWidth: '350px', backgroundColor: 'transparent', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Permanent Address *</h4>
                  <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <input 
                      type="checkbox" 
                      checked={isSameAsRes} 
                      onChange={e => setFormData({
                        ...formData, 
                        permanentAddress: { 
                          ...permAddr, 
                          sameAsResidential: e.target.checked 
                        }
                      })} 
                      style={{ accentColor: 'var(--primary)' }} 
                    />
                    Same
                  </label>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', opacity: isSameAsRes ? 0.5 : 1, pointerEvents: isSameAsRes ? 'none' : 'auto' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Dno</label>
                    <input type="text" value={isSameAsRes ? (resAddr.houseNo || '') : (permAddr.houseNo || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, houseNo: e.target.value}})} style={getInputStyle('perm_houseNo', isSameAsRes ? resAddr.houseNo : permAddr.houseNo)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Street Name</label>
                    <input type="text" value={isSameAsRes ? (resAddr.streetName || '') : (permAddr.streetName || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, streetName: e.target.value}})} style={getInputStyle('perm_streetName', isSameAsRes ? resAddr.streetName : permAddr.streetName)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Area</label>
                    <input type="text" value={isSameAsRes ? (resAddr.area || '') : (permAddr.area || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, area: e.target.value}})} style={getInputStyle('perm_area', isSameAsRes ? resAddr.area : permAddr.area)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City</label>
                    <input type="text" value={isSameAsRes ? (resAddr.city || '') : (permAddr.city || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, city: e.target.value}})} style={getInputStyle('perm_city', isSameAsRes ? resAddr.city : permAddr.city)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk/District</label>
                    <input type="text" value={isSameAsRes ? (resAddr.taluk || '') : (permAddr.taluk || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, taluk: e.target.value}})} style={getInputStyle('perm_taluk', isSameAsRes ? resAddr.taluk : permAddr.taluk)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PinCode</label>
                    <input type="text" value={isSameAsRes ? (resAddr.pincode || '') : (permAddr.pincode || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, pincode: e.target.value}})} style={getInputStyle('perm_pincode', isSameAsRes ? resAddr.pincode : permAddr.pincode)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>State</label>
                    <input type="text" value={isSameAsRes ? (resAddr.state || '') : (permAddr.state || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, state: e.target.value}})} style={getInputStyle('perm_state', isSameAsRes ? resAddr.state : permAddr.state)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Landmark</label>
                    <input type="text" value={isSameAsRes ? (resAddr.landmark || '') : (permAddr.landmark || '')} onChange={e => setFormData({...formData, permanentAddress: {...permAddr, landmark: e.target.value}})} style={getInputStyle('perm_landmark', isSameAsRes ? resAddr.landmark : permAddr.landmark)} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <>
      <div className="card" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Building size={20} color="var(--primary)" /> Property Details
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={(e) => { e.preventDefault(); setDocUploadType('LAND DOCUMENT'); setIsUploadModalOpen(true); }}
            title="Upload Property Documents" 
            style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.4rem', color: 'var(--primary)', cursor: 'pointer', display: 'flex', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            <Upload size={18} />
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Survey Number *</label>
          <input type="text" value={formData.propertyDetails?.surveyNo || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, surveyNo: e.target.value}})} style={getInputStyle('prop_surveyNo', formData.propertyDetails?.surveyNo)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Patta Number *</label>
          <input type="text" value={formData.propertyDetails?.pattaNo || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, pattaNo: e.target.value}})} style={getInputStyle('prop_pattaNo', formData.propertyDetails?.pattaNo)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Village</label>
          <input type="text" value={formData.propertyDetails?.village || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, village: e.target.value}})} style={getInputStyle('prop_village', formData.propertyDetails?.village)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Panchayat</label>
          <input type="text" value={formData.propertyDetails?.panchayat || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, panchayat: e.target.value}})} style={getInputStyle('prop_panchayat', formData.propertyDetails?.panchayat)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City</label>
          <input type="text" value={formData.propertyDetails?.city || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, city: e.target.value}})} style={getInputStyle('prop_city', formData.propertyDetails?.city)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk/District</label>
          <input type="text" value={formData.propertyDetails?.taluk || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, taluk: e.target.value}})} style={getInputStyle('prop_taluk', formData.propertyDetails?.taluk)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PinCode</label>
          <input type="text" value={formData.propertyDetails?.pincode || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, pincode: e.target.value}})} style={getInputStyle('prop_pincode', formData.propertyDetails?.pincode)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>State</label>
          <input type="text" value={formData.propertyDetails?.state || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, state: e.target.value}})} style={getInputStyle('prop_state', formData.propertyDetails?.state)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Landmark</label>
          <input type="text" value={formData.propertyDetails?.landmark || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, landmark: e.target.value}})} style={getInputStyle('prop_landmark', formData.propertyDetails?.landmark)} />
        </div>
      </div>
    </div>

    {/* Reference Details Island */}
    <div className="card" style={{ position: 'relative', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <User size={20} color="var(--primary)" /> Reference Details
        </h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Referred By</label>
          <select 
            value={formData.referenceDetails?.source || ''} 
            onChange={e => setFormData({...formData, referenceDetails: { source: e.target.value, name: '', mobile: '' }})} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'white' }}
          >
            <option value="">Select Option</option>
            <option value="Newspaper Ad">Newspaper Ad</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="Friend">Friend</option>
            <option value="Officers">Officers</option>
            <option value="Previous Customer">Previous Customer</option>
          </select>
        </div>

        {['Friend', 'Officers', 'Previous Customer'].includes(formData.referenceDetails?.source || '') && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Name</label>
              <input type="text" value={formData.referenceDetails?.name || ''} onChange={e => setFormData({...formData, referenceDetails: {...formData.referenceDetails, name: e.target.value}})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Mobile Number</label>
              <input type="text" value={formData.referenceDetails?.mobile || ''} onChange={e => setFormData({...formData, referenceDetails: {...formData.referenceDetails, mobile: e.target.value}})} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }} />
            </div>
          </>
        )}
      </div>
    </div>
  </>
  );

  const renderStep3 = () => (
    <div className="card">
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={20} color="var(--primary)" /> Fees Details
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Estimated Total Amount (₹) *</label>
          <input type="number" value={formData.feesAmount} onChange={e => setFormData({...formData, feesAmount: e.target.value})} placeholder="e.g. 50000" style={getInputStyle('feesAmount', formData.feesAmount)} />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Additional Notes regarding fees</label>
          <textarea value={formData.feeNotes} onChange={e => setFormData({...formData, feeNotes: e.target.value})} rows={3} placeholder="Fee breakdown or notes..." style={{ ...getInputStyle('feeNotes', formData.feeNotes), resize: 'vertical' }}></textarea>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => {
            if (id) {
              const previewData = { ...formData, uploadedFiles };
              localStorage.setItem('print_preview_data', JSON.stringify(previewData));
              window.open(`/print/application/${id}`, '_blank');
            } else {
              toast.error("Please save the draft first to generate an application PDF");
            }
          }}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={18} /> Download Application
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const handleDownload = (url: string, filename: string) => {
      if (url.includes('cloudinary.com') && url.endsWith('.pdf')) {
        const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        return;
      }
      
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
        })
        .catch(err => console.error("Error downloading file", err));
    };

    const handleDownloadAllAsZip = async () => {
      const validEntries = Object.entries(uploadedFiles).filter(([_, url]) => url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:')));
      if (validEntries.length === 0) {
        toast.error("No uploaded documents to download.");
        return;
      }

      const toastId = toast.loading("Creating ZIP archive of all documents...");
      try {
        const zip = new JSZip();
        const appFolder = zip.folder(id || 'Application_Documents');

        for (const [key, url] of validEntries) {
          const isPdf = (url as string).endsWith('.pdf');
          const ext = isPdf ? '.pdf' : '.jpg';
          const cleanName = `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;

          try {
            if ((url as string).startsWith('data:')) {
              const base64Data = (url as string).split(',')[1];
              appFolder?.file(cleanName, base64Data, { base64: true });
            } else {
              const res = await fetch(url as string);
              const blob = await res.blob();
              appFolder?.file(cleanName, blob);
            }
          } catch (fileErr) {
            console.error(`Failed to add ${key} to ZIP:`, fileErr);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const downloadUrl = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${id || 'Application'}_All_Documents.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        toast.success("All documents downloaded as ZIP successfully!", { id: toastId });
      } catch (err: any) {
        console.error("Failed to generate ZIP:", err);
        toast.error("Failed to generate ZIP. Downloading files individually...", { id: toastId });
        handleBulkDownload();
      }
    };

    const handleBulkDownload = () => {
      let delay = 0;
      Object.entries(uploadedFiles).forEach(([key, url]) => {
        if (url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'))) {
          const isPdf = url.endsWith('.pdf');
          setTimeout(() => handleDownload(url, `${key}${isPdf ? '.pdf' : '.jpg'}`), delay);
          delay += 500;
        }
      });
      toast.success("Downloading all documents...");
    };

    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <FileText size={20} color="var(--primary)" /> Uploaded Documents
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {id && (
              <button 
                onClick={() => {
                  const cleanMobile = (formData.mobile || '').replace(/\D/g, '').slice(-10);
                  if (!cleanMobile) {
                    toast.error("Customer mobile number not found.");
                    return;
                  }
                  const uploadUrl = `${window.location.origin}/upload/${id}`;
                  const text = `Dear ${formData.customerName || 'Customer'},\n\nGreetings from C.B. Building Approvals.\nYour building approval application (${id}) is in progress. Please use the secure link below to upload your documents:\n\n${uploadUrl}\n\nRequired documents:\n1. Customer Photo & Signature\n2. Aadhar Card & PAN Card\n3. Land Document / Sale Deed\n4. Patta & FMB Copy\n5. Proposed Building Plan\n\nThank you!\nCB Building Approvals`;
                  window.open(`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                title="Send Document Upload Link via WhatsApp"
              >
                <MessageCircle size={16} /> WhatsApp Link
              </button>
            )}
            <button 
              onClick={() => setIsReuploadModalOpen(true)}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f59e0b', borderColor: '#f59e0b', fontSize: '0.875rem' }}
            >
              <Upload size={16} /> Request Reupload
            </button>
            <button 
              onClick={handleDownloadAllAsZip}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#1044C4', fontSize: '0.875rem' }}
              title="Download all uploaded documents bundled in a single ZIP file"
            >
              <Archive size={16} /> Download All as ZIP
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(uploadedFiles).filter(([_,v]) => v && typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'))).map(([key, value]) => (
            <div key={key} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', backgroundColor: '#f8fafc' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)', textAlign: 'center', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                {key}
              </div>
              
              <div style={{ width: '100%', height: '150px', backgroundColor: '#e2e8f0', borderRadius: '0.25rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(value as string).endsWith('.pdf') ? (
                  <FileText size={48} color="var(--text-secondary)" />
                ) : (
                  <img src={value as string} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <a 
                  href={(value as string).endsWith('.pdf') ? (value as string).replace('.pdf', '.jpg') : (value as string)} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '0.25rem', textAlign: 'center', color: 'var(--primary-dark)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  View
                </a>
                <button 
                  onClick={(e) => { e.preventDefault(); handleDownload(value as string, `${key}${(value as string).endsWith('.pdf') ? '.pdf' : '.jpg'}`); }}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--primary)', border: 'none', borderRadius: '0.25rem', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))}
          
          {Object.entries(uploadedFiles).filter(([_,v]) => v && typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'))).length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No documents uploaded yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleRequestReuploadSubmit = async () => {
    if (selectedForReupload.length === 0) {
      toast.error('Please select at least one document for re-upload.');
      return;
    }

    setIsSendingReupload(true);
    const apiUrl = getApiUrl();
    const note = reuploadNote.trim() || 'Please re-upload clear and correct documents as requested.';

    try {
      if (id) {
        await fetch(`${apiUrl}/cases/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'DOCUMENTS_PENDING',
            requestedReuploads: selectedForReupload,
            reason: note,
          }),
        });
      }

      // Sync local storage
      const existingStr = localStorage.getItem('mock_saved_cases');
      if (existingStr && id) {
        const existing = JSON.parse(existingStr);
        const index = existing.findIndex((c: any) => c.id === id || c.application_number === id);
        if (index !== -1) {
          existing[index].status = 'DOCUMENTS_PENDING';
          existing[index].requestedReuploads = selectedForReupload;
          existing[index].reason = note;
          localStorage.setItem('mock_saved_cases', JSON.stringify(existing));
        }
      }

      setApplicationStatus('DOCUMENTS_PENDING');
      setIsReuploadModalOpen(false);
      toast.success(`Re-upload requested for ${selectedForReupload.length} document(s).`);

      // WhatsApp link convenience
      if (formData.mobile) {
        let phoneNumber = formData.mobile.replace(/\D/g, '');
        if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
        const uploadUrl = `${window.location.origin}/upload/${id}`;
        const message = encodeURIComponent(
          `Dear ${formData.customerName || 'Customer'},\n\nRe-upload is requested for your Building Approval application (${id}):\nDocuments: ${selectedForReupload.join(', ')}\nNote: ${note}\n\nPlease upload here: ${uploadUrl}`
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      }
    } catch (e: any) {
      console.error('Error requesting reupload:', e);
      toast.error('Failed to send re-upload request: ' + e.message);
    } finally {
      setIsSendingReupload(false);
    }
  };

  const renderDocumentVerificationScreen = () => {
    const docEntries = Object.entries(uploadedFiles).filter(
      ([k, v]) => v && !['RECEIPT', 'FINAL_APPROVAL', 'receiptNumber', 'username', 'password'].includes(k)
    );

    return (
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', marginBottom: '1rem' }}>
            <FileText size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 0.5rem 0' }}>
            Document Verification & Review
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '0.9rem' }}>
            Review the documents submitted by the customer. Inspect each document, flag any invalid documents for customer re-upload, or confirm verification to advance to Government Receipt & Submission.
          </p>
        </div>

        {/* Documents Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {docEntries.length > 0 ? (
            docEntries.map(([key, value]) => {
              const isMarked = selectedForReupload.includes(key);
              const fileStr = String(value);
              const isPdf = fileStr.startsWith('data:application/pdf') || fileStr.toLowerCase().endsWith('.pdf');

              return (
                <div
                  key={key}
                  style={{
                    border: isMarked ? '2px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    backgroundColor: isMarked ? '#fef2f2' : 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isMarked ? '#b91c1c' : 'var(--primary-dark)' }}>
                        {key}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '1rem',
                          backgroundColor: isMarked ? '#fee2e2' : '#dcfce7',
                          color: isMarked ? '#b91c1c' : '#15803d'
                        }}
                      >
                        {isMarked ? 'Needs Re-upload' : 'Uploaded'}
                      </span>
                    </div>

                    <div
                      onClick={() => { setDocUploadType(key); setModalTab('view'); setIsUploadModalOpen(true); }}
                      style={{
                        height: '110px',
                        backgroundColor: '#f8fafc',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        marginBottom: '1rem'
                      }}
                      title="Click to preview document"
                    >
                      {isPdf ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#0284c7' }}>
                          <FileText size={32} />
                          <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 600 }}>PDF Document</span>
                        </div>
                      ) : (
                        <img
                          src={fileStr}
                          alt={key}
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => { setDocUploadType(key); setModalTab('view'); setIsUploadModalOpen(true); }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Eye size={13} /> View
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForReupload(prev =>
                          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                        );
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: isMarked ? '#b91c1c' : '#fee2e2',
                        color: isMarked ? '#ffffff' : '#b91c1c',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <RotateCcw size={13} />
                      {isMarked ? 'Cancel Flag' : 'Flag Re-upload'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No customer documents uploaded yet.
            </div>
          )}
        </div>

        {/* Verification & Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            {selectedForReupload.length > 0 && (
              <span style={{ fontSize: '0.875rem', color: '#b91c1c', fontWeight: 600 }}>
                {selectedForReupload.length} document(s) flagged for re-upload
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsReuploadModalOpen(true)}
              disabled={selectedForReupload.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                backgroundColor: selectedForReupload.length === 0 ? '#f1f5f9' : '#ef4444',
                color: selectedForReupload.length === 0 ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: selectedForReupload.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RotateCcw size={18} /> Request Re-upload from Customer
            </button>

            <button
              type="button"
              onClick={async () => {
                setApplicationStatus('DOCUMENTS_VERIFIED');
                const apiUrl = getApiUrl();
                if (id) {
                  try {
                    await fetch(`${apiUrl}/cases/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'DOCUMENTS_VERIFIED', requestedReuploads: [] })
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
                const existingStr = localStorage.getItem('mock_saved_cases');
                if (existingStr && id) {
                  const existing = JSON.parse(existingStr);
                  const index = existing.findIndex((c: any) => c.id === id || c.application_number === id);
                  if (index !== -1) {
                    existing[index].status = 'DOCUMENTS_VERIFIED';
                    existing[index].requestedReuploads = [];
                    localStorage.setItem('mock_saved_cases', JSON.stringify(existing));
                  }
                }
                toast.success('All documents verified! Advancing to Receipt & Govt Portal Step.');
              }}
              className="btn-primary"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckCircle size={18} /> Confirm Verification & Proceed
            </button>
          </div>
        </div>

        {/* Modal: Request Reupload */}
        {isReuploadModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={22} color="#ef4444" /> Request Document Re-upload
                </h3>
                <button onClick={() => setIsReuploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                The application will be updated to <strong>Action Required (Documents Pending)</strong>. The customer will receive notifications and a direct link to re-upload only the selected documents.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Documents to be re-uploaded:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedForReupload.map(doc => (
                    <span key={doc} style={{ padding: '0.35rem 0.75rem', borderRadius: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Instructions / Reason for Rejection:
                </label>
                <textarea
                  rows={3}
                  value={reuploadNote}
                  onChange={(e) => setReuploadNote(e.target.value)}
                  placeholder="e.g. Photograph is not clear / Passport photo format required instead of ID card."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReuploadModalOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSendingReupload}
                  onClick={handleRequestReuploadSubmit}
                  style={{ padding: '0.6rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: isSendingReupload ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={16} /> {isSendingReupload ? 'Sending Request...' : 'Send Request to Customer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReceiptUploadScreen = () => (
    <div className="card" style={{ padding: '3rem 2rem' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem', textAlign: 'center' }}>Upload Receipt & Payment Info</h3>
      <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Receipt Number *</label>
           <input type="text" value={uploadedFiles.receiptNumber || ''} onChange={e => setUploadedFiles(prev => ({...prev, receiptNumber: e.target.value}))} placeholder="Enter Receipt No" style={getInputStyle('receiptNumber', uploadedFiles.receiptNumber)} />
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Username *</label>
           <input type="text" value={uploadedFiles.username || ''} onChange={e => setUploadedFiles(prev => ({...prev, username: e.target.value}))} placeholder="Enter Username" style={getInputStyle('username', uploadedFiles.username)} />
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Password *</label>
           <input type="password" value={uploadedFiles.password || ''} onChange={e => setUploadedFiles(prev => ({...prev, password: e.target.value}))} placeholder="Enter Password" style={getInputStyle('password', uploadedFiles.password)} />
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Receipt File *</label>
           <div 
            onClick={() => { setDocUploadType('RECEIPT'); setModalTab('upload'); setIsUploadModalOpen(true); }}
            style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '0.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer' }}>
            {uploadedFiles['RECEIPT'] ? (
              <div style={{ color: 'var(--success-green)', fontWeight: 600 }}><CheckCircle size={24} style={{ marginBottom: '0.5rem' }} /><div>Receipt Uploaded</div></div>
            ) : (
              <><Upload size={24} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} /><div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Upload Receipt File</div></>
            )}
           </div>
        </div>
        <button 
          onClick={async () => {
             const newErrors = [];
             if (!uploadedFiles.receiptNumber) newErrors.push('receiptNumber');
             if (!uploadedFiles.username) newErrors.push('username');
             if (!uploadedFiles.password) newErrors.push('password');
             setFormErrors(newErrors);
             
             if (newErrors.length > 0 || !uploadedFiles['RECEIPT']) { 
               toast.error("Please fill all mandatory fields and upload receipt file"); 
               return; 
             }
             
             setApplicationStatus('SUBMITTED_FOR_APPROVAL');
             const apiUrl = getApiUrl();
             if (id) {
               try {
                 await fetch(`${apiUrl}/cases/${id}`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ status: 'SUBMITTED_FOR_APPROVAL', uploadedFiles })
                 });
               } catch (e) { console.error(e); }
             }
             const existingStr = localStorage.getItem('mock_saved_cases');
             if (existingStr && id) {
               let existing = JSON.parse(existingStr);
               const index = existing.findIndex((c: any) => c.id === id);
               if (index !== -1) { 
                 existing[index].status = 'SUBMITTED_FOR_APPROVAL'; 
                 existing[index].uploadedFiles = uploadedFiles;
                 localStorage.setItem('mock_saved_cases', JSON.stringify(existing)); 
               }
             }
             toast.success('Payment submitted for final approval!');
          }}
          className="btn-primary"
          style={{ padding: '1rem', width: '100%' }}
        >
          Submit Payment & Receipt
        </button>
      </div>
    </div>
  );

  const renderFinalApprovalScreen = () => (
    <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '1rem' }}>Final Approval Upload</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Upload the signed and approved document to complete the application process.</p>
      <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
           <div 
            onClick={() => { setDocUploadType('FINAL_APPROVAL'); setModalTab('upload'); setIsUploadModalOpen(true); }}
            style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '0.5rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', cursor: 'pointer' }}>
            {uploadedFiles['FINAL_APPROVAL'] ? (
              <div style={{ color: 'var(--success-green)', fontWeight: 600 }}><CheckCircle size={24} style={{ marginBottom: '0.5rem' }} /><div>Approval Uploaded</div></div>
            ) : (
              <><Upload size={24} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} /><div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Upload Final Approval File</div></>
            )}
           </div>
        </div>
        <button 
          onClick={async () => {
             if (!uploadedFiles['FINAL_APPROVAL']) { toast.error("Please upload the final approval file"); return; }
             setApplicationStatus('COMPLETED');
             const apiUrl = getApiUrl();
             if (id) {
               try {
                 await fetch(`${apiUrl}/cases/${id}`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ status: 'COMPLETED', uploadedFiles })
                 });
               } catch (e) { console.error(e); }
             }
             const existingStr = localStorage.getItem('mock_saved_cases');
             if (existingStr && id) {
               let existing = JSON.parse(existingStr);
               const index = existing.findIndex((c: any) => c.id === id);
               if (index !== -1) { 
                 existing[index].status = 'COMPLETED'; 
                 existing[index].uploadedFiles = uploadedFiles;
                 localStorage.setItem('mock_saved_cases', JSON.stringify(existing)); 
               }
             }
             toast.success('Application successfully completed!');
             if (isEmployee) navigate('/employee/applications');
             else navigate('/admin/applications');
          }}
          className="btn-primary"
          style={{ padding: '1rem', width: '100%' }}
        >
          Upload Approval & Complete
        </button>
      </div>
    </div>
  );

  const renderUploadModal = () => {
    if (!isUploadModalOpen) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '500px', backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          {/* Header */}
          <div style={{ backgroundColor: '#1e3a8a', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>IDProof</h3>
            <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
            <div 
              onClick={() => setModalTab('upload')}
              style={{ flex: 1, padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-color)', color: modalTab === 'upload' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: modalTab === 'upload' ? 600 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: modalTab === 'upload' ? 'white' : 'transparent' }}>
              <Upload size={18} /> Upload File
            </div>
            <div 
              onClick={() => setModalTab('view')}
              style={{ flex: 1, padding: '0.75rem', textAlign: 'center', color: modalTab === 'view' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: modalTab === 'view' ? 600 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: modalTab === 'view' ? 'white' : 'transparent' }}>
              <FileText size={18} /> View File
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Doc Type Dropdown */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Doc Type</label>
              <select value={docUploadType} onChange={e => setDocUploadType(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', outline: 'none', backgroundColor: '#f8fafc', color: 'var(--primary-dark)', fontWeight: 500 }}>
                {currentStep === 1 ? (
                  <>
                    <option value="CUSTOMER PHOTOGRAPH">CUSTOMER PHOTOGRAPH</option>
                    <option value="CUSTOMER SIGNATURE">CUSTOMER SIGNATURE</option>
                    <option value="AADHAR CARD">AADHAR CARD</option>
                    <option value="PAN CARD">PAN CARD</option>
                  </>
                ) : (
                  <>
                    <option value="CUSTOMER PHOTOGRAPH">CUSTOMER PHOTOGRAPH</option>
                    <option value="CUSTOMER SIGNATURE">CUSTOMER SIGNATURE</option>
                    <option value="AADHAR CARD">AADHAR CARD</option>
                    <option value="PAN CARD">PAN CARD</option>
                    <option value="LAND DOCUMENT">LAND DOCUMENT</option>
                    <option value="SALE DEED">SALE DEED</option>
                    <option value="PATTA">PATTA</option>
                    <option value="FMB">FMB</option>
                    <option value="PROPERTY SIGNATURE">SIGNATURE</option>
                    <option value="BUILDING PLAN">BUILDING PLAN</option>
                    <option value="RECEIPT">RECEIPT</option>
                    <option value="FINAL_APPROVAL">FINAL APPROVAL</option>
                  </>
                )}
              </select>
            </div>

            {/* Dynamic Area: Upload or View */}
            {modalTab === 'upload' ? (
              <div style={{ padding: '2rem 1rem', border: '1px dashed var(--border-color)', borderRadius: '0.25rem', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>
                  {uploadedFiles[docUploadType as keyof typeof uploadedFiles] ? 'File Selected' : `${docUploadType}_1`}
                </span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept={docUploadType === 'CUSTOMER PHOTOGRAPH' ? 'image/*' : '*/*'} disabled={isUploading} />
                  <button onClick={() => !isUploading && fileInputRef.current?.click()} title="Browse" style={{ background: 'none', border: 'none', color: isUploading ? 'var(--text-secondary)' : 'var(--primary)', cursor: isUploading ? 'not-allowed' : 'pointer' }} disabled={isUploading}><Upload size={24} /></button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', minHeight: '150px' }}>
                {uploadedFiles[docUploadType as keyof typeof uploadedFiles] ? (
                  (() => {
                    const fileData = uploadedFiles[docUploadType as keyof typeof uploadedFiles] as string;
                    const isPdf = fileData.startsWith('data:application/pdf') || fileData.toLowerCase().endsWith('.pdf');
                    
                    if (isPdf) {
                      return (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ padding: '0.5rem', backgroundColor: '#e0f2fe', textAlign: 'center', marginBottom: '0.5rem', borderRadius: '0.25rem' }}>
                            <a href={fileData} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                              <FileText size={16} /> Open PDF in New Tab
                            </a>
                          </div>
                          <embed src={fileData} type="application/pdf" width="100%" height="350px" style={{ border: 'none' }} />
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)', width: '100%' }}>
                           <a href={fileData} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', width: '100%', display: 'flex', justifyContent: 'center' }}>
                             <img src={fileData} alt="Uploaded Document" style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain' }} 
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 if (e.currentTarget.nextElementSibling) {
                                   (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                 }
                               }} 
                             />
                             <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)' }}>
                               <FileText size={48} style={{ marginBottom: '1rem' }} />
                               <span style={{ fontWeight: 500 }}>View Document</span>
                             </div>
                           </a>
                        </div>
                      );
                    }
                  })()
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>No file uploaded yet for {docUploadType}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => { setUploadedFiles(prev => ({ ...prev, [docUploadType]: undefined })); toast.success('File deleted'); }} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#e2e8f0', color: '#64748b', border: 'none', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer' }}>DELETE</button>
              <button onClick={() => {toast.success(`${docUploadType} saved`); setIsUploadModalOpen(false);}} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer' }}>SAVE</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isForbidden) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
        <AlertTriangle size={48} color="var(--error-red)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You do not have permission to view or manage application <strong>{id}</strong>. Workers can only access applications directly assigned to them by the Admin.
        </p>
        <button className="btn-primary" onClick={() => navigate(isEmployee ? '/employee/applications' : '/admin/applications')}>
          Return to My Applications
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem', margin: '0 auto' }}>


      {(() => {
        const isWorkflowScreen = !isEditMode && ['DOCUMENTS_VERIFICATION', 'DOCUMENTS_VERIFIED', 'SUBMITTED_FOR_APPROVAL'].includes(applicationStatus);

        if (isWorkflowScreen) {
          return (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button 
                  onClick={() => navigate(isEmployee ? '/employee/applications' : '/admin/applications')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.875rem', padding: 0 }}
                >
                  <ArrowLeft size={16} /> Back to Applications
                </button>
                <button
                  onClick={() => navigate(`?edit=true`)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8125rem'
                  }}
                >
                  <FileText size={16} /> Edit / View Full Form Details
                </button>
              </div>
              {applicationStatus === 'DOCUMENTS_VERIFICATION' && renderDocumentVerificationScreen()}
              {applicationStatus === 'DOCUMENTS_VERIFIED' && renderReceiptUploadScreen()}
              {applicationStatus === 'SUBMITTED_FOR_APPROVAL' && renderFinalApprovalScreen()}
            </div>
          );
        }

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <button 
                  onClick={() => navigate(isEmployee ? '/employee/applications' : '/admin/applications')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.875rem', padding: 0 }}
                >
                  <ArrowLeft size={16} /> Back to Applications
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    const link = `${window.location.origin}/upload/${id || 'NEW'}`;
                    navigator.clipboard.writeText(link);
                    
                    if (id) {
                      const localCasesStr = localStorage.getItem('mock_saved_cases');
                      if (localCasesStr) {
                        const localCases = JSON.parse(localCasesStr);
                        const cIndex = localCases.findIndex((c: any) => (c.application_number || c.id) === id);
                        if (cIndex !== -1) {
                          if (!localCases[cIndex].linkTracking) {
                            localCases[cIndex].linkTracking = {};
                          }
                          if (formData.email) {
                            localCases[cIndex].linkTracking.sendStatus = 'success';
                          } else {
                            localCases[cIndex].linkTracking.sendStatus = 'failed';
                          }
                          localCases[cIndex].linkTracking.sent = true;
                          localCases[cIndex].linkTracking.sentDate = new Date().toISOString();
                          localStorage.setItem('mock_saved_cases', JSON.stringify(localCases));
                          window.dispatchEvent(new Event('storage'));
                        }
                      }
                    }
                    
                    toast.success('Upload link copied! Share this with the customer.');
                    if (formData.mobile) {
                      let phoneNumber = formData.mobile.replace(/\D/g, '');
                      if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
                      const message = encodeURIComponent(`Hello ${formData.customerName || ''},\n\nPlease use the following link to upload your documents for building approval:\n${link}`);
                      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                    } else {
                      toast.error('Please enter a mobile number to share via WhatsApp.');
                    }
                  }}
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                >
                  <Send size={18} /> Share Upload Link
                </button>
              </div>
            </div>

            {/* Submitted Status Banner */}
            {['SUBMITTED', 'Submitted'].includes(applicationStatus) && (
              <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={24} color="#7e22ce" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#6b21a8' }}>Status: SUBMITTED</h4>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7e22ce' }}>Application has been submitted and is currently in review. Review application details or uploaded documents below.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentStep(4)} 
                  style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#7e22ce', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FileText size={16} /> View Documents (Step 4)
                </button>
              </div>
            )}

            {/* Completed / Approved / Rejected Banner */}
            {['COMPLETED', 'Completed', 'Approved', 'Rejected'].includes(applicationStatus) && (
               <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem', backgroundColor: applicationStatus === 'Rejected' ? '#fef2f2' : '#f0fdf4', border: applicationStatus === 'Rejected' ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                  {applicationStatus === 'Rejected' ? <X size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} /> : <CheckCircle size={48} color="var(--success-green)" style={{ margin: '0 auto 1rem' }} />}
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Application {applicationStatus.toUpperCase()}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>This application process has been completely verified and finalized.</p>
               </div>
            )}

            {renderStepIndicator()}
            <div style={{ marginBottom: '2rem' }}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </div>
            {currentStep < 4 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <button onClick={handlePrev} disabled={currentStep === 1} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: currentStep === 1 ? 'var(--bg-secondary)' : 'var(--bg-surface)', border: '1px solid var(--border-color)', color: currentStep === 1 ? 'var(--text-secondary)' : 'var(--primary-dark)', fontWeight: 600, cursor: currentStep === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button onClick={handleNext} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}
            {currentStep === 4 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '1rem', backgroundColor: 'transparent' }}>
                <button onClick={handlePrev} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--primary-dark)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ArrowLeft size={18} /> Back to Fees Details
                </button>
              </div>
            )}
          </>
        );
      })()}

      {renderUploadModal()}
      
      {/* Partial Save Modal */}
      {isPartialSaveModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '400px', backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ backgroundColor: '#f59e0b', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={20} /> Save Partially
              </h3>
              <button onClick={() => setIsPartialSaveModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Select a reason for saving the application partially. You can resume this application later.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {['Documents pending', 'Details not fully collected', 'Payment not confirmed', 'Verification pending'].map((reason) => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="saveReason" 
                      value={reason} 
                      checked={saveReason === reason} 
                      onChange={() => setSaveReason(reason)}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: '#f59e0b' }}
                    />
                    <span style={{ fontSize: '0.9375rem', color: 'var(--primary-dark)', fontWeight: 500 }}>{reason}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setIsPartialSaveModalOpen(false)}
                  style={{ padding: '0.625rem 1rem', borderRadius: '0.25rem', backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePartialSave}
                  style={{ padding: '0.625rem 1.5rem', borderRadius: '0.25rem', backgroundColor: '#f59e0b', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={18} /> Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Submit/Save Button */}
      {!['COMPLETED', 'Completed', 'Approved', 'Rejected'].includes(applicationStatus) && (
        <div 
          onMouseEnter={() => setSaveMenuOpen(true)}
          onMouseLeave={() => setSaveMenuOpen(false)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1rem',
          }}
        >
          {currentStep === 4 ? (
            <>
              {isSaveMenuOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.5rem', animation: 'fadeIn 0.2s ease-in-out' }}>
                  <button 
                    onClick={() => setIsPartialSaveModalOpen(true)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '2rem', backgroundColor: 'white', color: '#f59e0b', border: '2px solid #f59e0b', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                  >
                    <Save size={16} /> Save as Draft
                  </button>
                </div>
              )}
              <button 
                onClick={async () => {
                  if (!checkAllDocumentsUploaded()) {
                     toast.error("Please upload all required documents to submit!");
                     return;
                  }
                  await saveApplicationData(false);
                  toast.success("Application Submitted for Verification!");
                  if (isEmployee) navigate('/employee/applications');
                  else navigate('/admin/applications');
                }}
                style={{
                  padding: '1rem',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  transform: isSaveMenuOpen ? 'scale(1.1)' : 'scale(1)'
                }}
                title="Submit Application"
              >
                <CheckCircle size={24} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsPartialSaveModalOpen(true)}
              style={{
                padding: '1rem',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                transform: 'scale(1)'
              }}
              title="Save as Draft"
            >
              <Save size={24} />
            </button>
          )}
        </div>
      )}

      {/* Request Reupload Modal */}
      {isReuploadModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '2rem', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>Request Reupload</h3>
              <button onClick={() => setIsReuploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select the documents that the customer needs to reupload:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['CUSTOMER PHOTOGRAPH', 'CUSTOMER SIGNATURE', 'AADHAR CARD', 'PAN CARD', 'SALE DEED', 'PATTA', 'FMB', 'BUILDING PLAN'].map(docType => (
                  <label key={docType} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedForReupload.includes(docType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForReupload([...selectedForReupload, docType]);
                        } else {
                          setSelectedForReupload(selectedForReupload.filter(d => d !== docType));
                        }
                      }}
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontWeight: 500, color: 'var(--primary-dark)' }}>{docType}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setIsReuploadModalOpen(false)}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (selectedForReupload.length === 0) {
                    toast.error('Please select at least one document to request reupload.');
                    return;
                  }
                  
                  // Save requested reuploads to localstorage
                  if (id) {
                    const localCasesStr = localStorage.getItem('mock_saved_cases');
                    if (localCasesStr) {
                      const localCases = JSON.parse(localCasesStr);
                      const cIndex = localCases.findIndex((c: any) => (c.application_number || c.id) === id);
                      if (cIndex !== -1) {
                        localCases[cIndex].requestedReuploads = selectedForReupload;
                        localStorage.setItem('mock_saved_cases', JSON.stringify(localCases));
                        window.dispatchEvent(new Event('storage'));
                      }
                    }
                  }
                  
                  const link = `${window.location.origin}/upload/${id || 'NEW'}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Reupload request sent! Link copied to clipboard.');
                  
                  if (formData.mobile) {
                    let phoneNumber = formData.mobile.replace(/\D/g, '');
                    if (phoneNumber.length === 10) phoneNumber = '91' + phoneNumber;
                    const message = encodeURIComponent(`Hello ${formData.customerName || ''},\n\nPlease use the following link to reupload the requested documents:\n${link}`);
                    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                  } else {
                    toast.error('Please enter a mobile number to share via WhatsApp.');
                  }
                  
                  setIsReuploadModalOpen(false);
                }}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Send size={18} /> Send Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationDetail;
