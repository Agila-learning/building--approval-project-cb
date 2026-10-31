import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Building, FileText, Upload, CheckCircle, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFileToCloudinary, getApiUrl } from '../../config/api';
import { validateUploadFile } from '../../utils/imageValidation';

interface NewApplicationProps {
  isCustomer?: boolean;
}

const NewApplication: React.FC<NewApplicationProps> = ({ isCustomer = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffList, setStaffList] = useState<any[]>([]);

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

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = isCustomer ? 2 : 3;

  React.useEffect(() => {
    if (isCustomer) {
      setCurrentStep(1);
      try {
        localStorage.removeItem('newApp_currentStep');
      } catch (e) {
        // ignore
      }
    }
  }, [isCustomer]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaveMenuOpen, setSaveMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPartialSaveModalOpen, setIsPartialSaveModalOpen] = useState(false);
  const [saveReason, setSaveReason] = useState('Documents pending');
  const [docUploadType, setDocUploadType] = useState('CUSTOMER PHOTOGRAPH');
  const [modalTab, setModalTab] = useState<'upload' | 'view'>('upload');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [missingDocErrors, setMissingDocErrors] = useState<string[]>([]);

  const MANDATORY_DOCUMENTS = React.useMemo(() => [
    { key: 'CUSTOMER PHOTOGRAPH', label: 'Customer Photograph', step: 1 },
    { key: 'CUSTOMER SIGNATURE', label: 'Customer Signature', step: 1 },
    { key: 'AADHAR CARD', label: 'Aadhaar Card', step: 1 },
    { key: 'PAN CARD', label: 'PAN Card', step: 1 },
    { key: 'SALE DEED', altKey: 'LAND DOCUMENT', label: 'Sale Deed / Land Document', step: 2 },
    { key: 'PATTA', label: 'Patta', step: 2 },
    { key: 'BUILDING PLAN', label: 'Building Plan', step: 2 }
  ], []);
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
  }>(() => {
    if (location.state?.lead) {
      const lead = location.state.lead;
      const files: any = {};
      if (lead.aadharFile) files['AADHAR CARD'] = lead.aadharFile;
      if (lead.buildingPhoto) files['CUSTOMER PHOTOGRAPH'] = lead.buildingPhoto;
      // Copy files object from lead if it was submitted via older ApplyNow form
      if (lead.files) {
        if (lead.files.photo) files['CUSTOMER PHOTOGRAPH'] = lead.files.photo.data;
        if (lead.files.signature) files['CUSTOMER SIGNATURE'] = lead.files.signature.data;
        if (lead.files.aadhar) files['AADHAR CARD'] = lead.files.aadhar.data;
        if (lead.files.pan) files['PAN CARD'] = lead.files.pan.data;
        if (lead.files.sale_deed) files['SALE DEED'] = lead.files.sale_deed.data;
        if (lead.files.patta) files['PATTA'] = lead.files.patta.data;
        if (lead.files.fmb) files['FMB'] = lead.files.fmb.data;
        if (lead.files.building_plan) files['BUILDING PLAN'] = lead.files.building_plan.data;
      }
      return files;
    }
    return {};
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Strict image & document verification (prevents uploading Aadhaar/PAN/documents for photo or signature)
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
        setUploadedFiles(prev => ({ ...prev, [docUploadType]: imageUrl }));
        setMissingDocErrors(prev => prev.filter(k => k !== docUploadType && !(docUploadType === 'LAND DOCUMENT' && k === 'SALE DEED') && !(docUploadType === 'SALE DEED' && k === 'LAND DOCUMENT')));
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
    if (location.state?.lead) {
      const lead = location.state.lead;
      return {
        serviceType: lead.projectType === 'Residential' ? 'building' : lead.projectType || '',
        customerName: lead.name || '',
        fatherName: '',
        dob: '',
        mobile: lead.phone || '',
        email: lead.email || '',
        altMobile: '',
        aadhar: '',
        pan: '',
        residentialAddress: { houseNo: '', streetName: '', area: lead.location || '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '', accomodationType: 'Own', yearsResiding: '' },
        permanentAddress: { sameAsResidential: true, houseNo: '', streetName: '', area: lead.location || '', city: '', taluk: '', pincode: '', state: '', country: 'INDIA', landmark: '' },
        staff: isEmployee ? loggedInUser : '',
        propertyDetails: { surveyNo: '', pattaNo: '', dno: '', streetName: '', village: lead.location || '', panchayat: '', city: '', taluk: '', pincode: '', state: '', landmark: '' },
        feesAmount: '',
        feeNotes: '',
        leadId: lead.id, // Store the lead ID to delete or convert it later
        reference: '',
        referenceDetails: { source: '', name: '', mobile: '' }
      };
    }
    return {
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
      reference: '',
      referenceDetails: { source: '', name: '', mobile: '' },
      
      // Page 2: Property Details
      propertyDetails: { surveyNo: '', pattaNo: '', dno: '', streetName: '', village: '', panchayat: '', city: '', taluk: '', pincode: '', state: '', landmark: '' },
      
      // Page 3: Fees Details
      feesAmount: '',
      feeNotes: '',
    };
  });

  React.useEffect(() => {
    try {
      if (!isCustomer) {
        localStorage.setItem('newApp_currentStep', currentStep.toString());
      }
    } catch (e) {
      console.error("Storage quota exceeded", e);
    }
  }, [currentStep, isCustomer]);

  React.useEffect(() => {
    try {
      localStorage.setItem('newApp_uploadedFiles', JSON.stringify(uploadedFiles));
    } catch (e) {
      console.error("Storage quota exceeded", e);
      toast.error("Storage limit reached! Please clear previous drafts or compress your images.");
    }
  }, [uploadedFiles]);

  React.useEffect(() => {
    try {
      localStorage.setItem('newApp_formData', JSON.stringify(formData));
    } catch (e) {
      console.error("Storage quota exceeded", e);
    }
  }, [formData]);

  const saveApplicationData = async (isPartial: boolean, reason?: string): Promise<string | false> => {
    try {
      const typeMap: Record<string, string> = {
        'building': 'BUILDING_PLAN_APPROVAL',
        'plan': 'LAYOUT_APPROVAL',
        'occupancy': 'COMPLETION_CERTIFICATE',
        'regularisation': 'PATTA_TRANSFER'
      };
      
      const existingStr = localStorage.getItem('mock_saved_cases');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      
      let nextAppNum = 7001;
      
      // Fetch from API to get highest number
      let existingApi = [];
      try {
        const allCasesRes = await fetch(`${getApiUrl()}/cases`);
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
      
      const finalAppNumber = `${nextAppNum}`;

      const propertyFullAddress = [
        formData.residentialAddress?.houseNo,
        formData.residentialAddress?.streetName,
        formData.propertyDetails?.village || formData.residentialAddress?.area,
        formData.propertyDetails?.city || formData.residentialAddress?.city,
        formData.propertyDetails?.taluk || formData.residentialAddress?.taluk,
        formData.propertyDetails?.pincode || formData.residentialAddress?.pincode
      ].filter(Boolean).join(', ');

      const propertyVillage = formData.propertyDetails?.village || formData.propertyDetails?.panchayat || formData.residentialAddress?.area || formData.residentialAddress?.city || 'TBD';
      const propertyTaluk = formData.propertyDetails?.taluk || formData.residentialAddress?.taluk || 'TBD';

      const mockCase = {
        id: finalAppNumber,
        application_number: finalAppNumber,
        property: {
          owner_name: formData.customerName || 'Draft Owner',
          owner_phone: formData.mobile || '',
          jurisdiction: formData.propertyDetails?.panchayat || 'DTCP',
          address: propertyFullAddress,
          village: propertyVillage,
          taluk: propertyTaluk,
          survey_number: formData.propertyDetails?.surveyNo || 'TBD'
        },
        fullData: {
          ...formData,
          staff: isCustomer ? 'Unassigned' : (formData.staff || 'Unassigned')
        },
        uploadedFiles: uploadedFiles,
        approval_type: typeMap[formData.serviceType] || 'BUILDING_PLAN_APPROVAL',
        status: isPartial ? 'Draft' : 'Application Submitted',
        assigned_staff: (!isCustomer && formData.staff && formData.staff !== 'Unassigned') ? { name: formData.staff.split(' — ')[0] } : { name: 'Unassigned' },
        created_at: new Date().toISOString(),
        reason: reason || ''
      };
      localStorage.setItem('mock_saved_cases', JSON.stringify([mockCase, ...existing]));

      // Also persist to recentApplications so TrackApplication immediately finds it
      try {
        const recentStr = localStorage.getItem('recentApplications');
        const recent = recentStr ? JSON.parse(recentStr) : [];
        const newRecent = {
          id: finalAppNumber,
          application_number: finalAppNumber,
          applicantName: formData.customerName || 'Applicant',
          mobile: formData.mobile || '',
          email: formData.email || '',
          serviceType: typeMap[formData.serviceType] || 'Building Approval',
          propertyType: 'Residential',
          address: propertyFullAddress,
          village: propertyVillage,
          taluk: propertyTaluk,
          location: propertyVillage,
          status: isPartial ? 'Draft' : 'Application Submitted',
          created_at: new Date().toISOString(),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fullData: {
            ...formData,
            staff: isCustomer ? 'Unassigned' : (formData.staff || 'Unassigned')
          },
          uploadedFiles: uploadedFiles
        };
        localStorage.setItem('recentApplications', JSON.stringify([newRecent, ...recent.filter((r: any) => r.id !== finalAppNumber && r.application_number !== finalAppNumber)]));
      } catch (e) {
        console.error("Failed to save recentApplications", e);
      }

      localStorage.removeItem('newApp_formData');
      localStorage.removeItem('newApp_currentStep');
      localStorage.removeItem('newApp_uploadedFiles');

      const payload = {
        application_number: finalAppNumber,
        property: {
          create: {
            owner_name: formData.customerName || 'Draft Owner',
            owner_phone: formData.mobile || '0000000000',
            owner_email: formData.email || '',
            address: propertyFullAddress,
            village: propertyVillage,
            taluk: propertyTaluk,
            survey_number: formData.propertyDetails?.surveyNo || 'TBD',
            jurisdiction: formData.propertyDetails?.panchayat || 'DTCP'
          }
        },
        approval_type: typeMap[formData.serviceType] || 'BUILDING_PLAN_APPROVAL',
        status: isPartial ? 'Draft' : 'Application Submitted',
        assigned_staff: (!isCustomer && formData.staff && formData.staff !== 'Unassigned') ? { name: formData.staff.split(' — ')[0] } : undefined,
        fullData: {
          ...formData,
          staff: isCustomer ? 'Unassigned' : (formData.staff || 'Unassigned')
        },
        uploadedFiles: uploadedFiles,
        reason: reason || ''
      };
      
      // If converting a lead, also delete the lead or update its status
      if (formData.leadId) {
        const savedLeadsStr = localStorage.getItem('mock_saved_cases');
        if (savedLeadsStr) {
          let savedCases = JSON.parse(savedLeadsStr);
          savedCases = savedCases.map((c: any) => c.id === formData.leadId ? { ...c, status: 'Application Created', type: 'Converted Lead' } : c);
          localStorage.setItem('mock_saved_cases', JSON.stringify(savedCases));
        }

        try {
          await fetch(`${getApiUrl()}/leads/${formData.leadId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Application Created' })
          });
        } catch (e) {
          console.error("Failed to update lead status:", e);
        }
      }
      
      const res = await fetch(`${getApiUrl()}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdMongoCase = await res.json();
        // Also keep local storage in sync with actual MongoDB id
        const updatedLocalCases = [createdMongoCase, ...existing.filter((e: any) => e.id !== finalAppNumber && e.application_number !== finalAppNumber)];
        localStorage.setItem('mock_saved_cases', JSON.stringify(updatedLocalCases));
      }
      
      return finalAppNumber;
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


  const handleNext = () => {
    let errors: string[] = [];
    
    // Validation for Step 1
    if (currentStep === 1) {
      if (!formData.serviceType) errors.push('serviceType');
      if (!isCustomer && !formData.staff) errors.push('staff');
      if (!formData.customerName) errors.push('customerName');
      if (!formData.fatherName) errors.push('fatherName');
      if (!formData.dob) errors.push('dob');

      // Mobile: strictly 10 digits starting with 6,7,8,9
      const cleanMobile = (formData.mobile || '').replace(/\D/g, '');
      if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
        errors.push('mobile');
        toast.error('Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      }

      // Alternate Mobile: if entered, strictly 10 digits starting with 6,7,8,9
      if (formData.altMobile) {
        const cleanAlt = formData.altMobile.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
          errors.push('altMobile');
          toast.error('Alternative number must be exactly 10 digits starting with 6, 7, 8, or 9.');
        }
      }

      // Email: must contain @ and valid domain
      const cleanEmail = (formData.email || '').trim();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errors.push('email');
        toast.error('Please enter a valid email address (e.g. name@example.com).');
      }

      // Aadhar: strictly 12 digits
      const cleanAadhar = (formData.aadhar || '').replace(/\D/g, '');
      if (!cleanAadhar || cleanAadhar.length !== 12) {
        errors.push('aadhar');
        toast.error('Aadhar number must be exactly 12 digits.');
      }

      // PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
      const cleanPan = (formData.pan || '').trim().toUpperCase();
      if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        errors.push('pan');
        toast.error('PAN number must be 10 characters in the format ABCDE1234F.');
      }
      
      // Residential Address: Require streetName (or area), city, state, pincode. House number is optional.
      if (!formData.residentialAddress.streetName && !formData.residentialAddress.area) {
        errors.push('res_streetName');
      }
      if (!formData.residentialAddress.city) errors.push('res_city');
      const resPin = (formData.residentialAddress.pincode || '').replace(/\D/g, '');
      if (!resPin || !/^\d{6}$/.test(resPin)) {
        errors.push('res_pincode');
        toast.error('PIN code must be exactly 6 digits.');
      }
      if (!formData.residentialAddress.state) errors.push('res_state');
      
      // Permanent Address: only if different from residential
      if (!formData.permanentAddress.sameAsResidential) {
        const perm = formData.permanentAddress;
        if (!perm.streetName && !perm.area) errors.push('perm_streetName');
        if (!perm.city) errors.push('perm_city');
        const permPin = (perm.pincode || '').replace(/\D/g, '');
        if (!permPin || !/^\d{6}$/.test(permPin)) {
          errors.push('perm_pincode');
          toast.error('Permanent PIN code must be exactly 6 digits.');
        }
        if (!perm.state) errors.push('perm_state');
      }

      // Strictly validate Step 1 Mandatory Documents before moving to Step 2
      const step1MissingDocs: string[] = [];
      if (!uploadedFiles['CUSTOMER PHOTOGRAPH']) step1MissingDocs.push('CUSTOMER PHOTOGRAPH');
      if (!uploadedFiles['CUSTOMER SIGNATURE']) step1MissingDocs.push('CUSTOMER SIGNATURE');
      if (!uploadedFiles['AADHAR CARD'] && !formData.aadhar) step1MissingDocs.push('AADHAR CARD');
      if (!uploadedFiles['PAN CARD'] && !formData.pan) step1MissingDocs.push('PAN CARD');

      if (step1MissingDocs.length > 0) {
        setMissingDocErrors(prev => Array.from(new Set([...prev, ...step1MissingDocs])));
        toast.error("Please upload Customer Photo, Signature, Aadhaar & PAN on Step 1 before proceeding.");
        return;
      }
    }
    
    // Validation for Step 2
    if (currentStep === 2) {
      if (!formData.propertyDetails?.surveyNo) errors.push('prop_surveyNo');
      if (!formData.propertyDetails?.pattaNo) errors.push('prop_pattaNo');
      if (formData.propertyDetails?.pincode) {
        const propPin = formData.propertyDetails.pincode.replace(/\D/g, '');
        if (!/^\d{6}$/.test(propPin)) {
          errors.push('prop_pincode');
          toast.error('Property PIN code must be exactly 6 digits.');
        }
      }
    }

    // Validation for Step 3
    if (currentStep === 3) {
      if (!formData.feesAmount) errors.push('feesAmount');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      const fieldLabels: Record<string, string> = {
        serviceType: 'Service Type',
        staff: 'Assigned Employee',
        customerName: 'Customer Name',
        fatherName: 'Father Name',
        dob: 'Date of Birth',
        mobile: 'Mobile Number',
        email: 'Email ID',
        aadhar: 'Aadhar Number',
        pan: 'PAN Number',
        res_streetName: 'Street Name / Area',
        res_city: 'City',
        res_pincode: 'PinCode',
        res_state: 'State',
        perm_streetName: 'Permanent Street Name / Area',
        perm_city: 'Permanent City',
        perm_pincode: 'Permanent PinCode',
        perm_state: 'Permanent State',
        prop_surveyNo: 'Survey Number',
        prop_pattaNo: 'Patta Number',
        prop_pincode: 'Property PIN Code',
        feesAmount: 'Fees Amount',
      };
      const missingList = errors.map(e => fieldLabels[e] || e).join(', ');
      toast.error(`Please fill mandatory fields: ${missingList}`);
      return;
    }

    setFormErrors([]);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    let errors: string[] = [];
    if (!formData.propertyDetails?.surveyNo) errors.push('prop_surveyNo');
    if (!formData.propertyDetails?.pattaNo) errors.push('prop_pattaNo');

    if (formData.propertyDetails?.pincode) {
      const propPin = formData.propertyDetails.pincode.replace(/\D/g, '');
      if (!/^\d{6}$/.test(propPin)) {
        errors.push('prop_pincode');
        toast.error('Property PIN code must be exactly 6 digits.');
      }
    }

    if (!isCustomer && currentStep === 3) {
      if (!formData.feesAmount) errors.push('feesAmount');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      const fieldLabels: Record<string, string> = {
        prop_surveyNo: 'Survey Number',
        prop_pattaNo: 'Patta Number',
        prop_pincode: 'Property PIN Code',
        feesAmount: 'Fees Amount',
      };
      const missingList = errors.map(e => fieldLabels[e] || e).join(', ');
      toast.error(`Please fill mandatory fields: ${missingList}`);
      return;
    }

    // MANDATORY DOCUMENT UPLOAD VALIDATION
    const missingDocs = MANDATORY_DOCUMENTS.filter(doc => {
      const file = uploadedFiles[doc.key as keyof typeof uploadedFiles] || (doc.altKey && uploadedFiles[doc.altKey as keyof typeof uploadedFiles]);
      return !file;
    });

    if (missingDocs.length > 0) {
      const missingKeys = missingDocs.map(d => d.key);
      setMissingDocErrors(missingKeys);
      toast.error("Please upload all required documents before submitting your application.");
      return;
    }

    setMissingDocErrors([]);

    const appNumber = await saveApplicationData(false);
    if (appNumber) {
      toast.success(`Congratulations! Application #${appNumber} submitted successfully.`);
      if (isCustomer) {
        navigate(`/track-application?id=${appNumber}&mobile=${formData.mobile}`);
      } else if (isEmployee) {
        navigate('/employee/applications');
      } else {
        navigate('/admin/applications');
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStepIndicator = () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
        {[1, 2, 3].slice(0, totalSteps).map((step) => (
          <React.Fragment key={step}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              backgroundColor: currentStep >= step ? 'var(--primary)' : 'var(--bg-secondary)',
              color: currentStep >= step ? 'white' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.875rem', border: currentStep >= step ? 'none' : '1px solid var(--border-color)'
            }}>
              {step}
            </div>
            {step < totalSteps && (
              <div style={{ 
                width: '60px', height: '4px', 
                backgroundColor: currentStep > step ? 'var(--primary)' : 'var(--bg-secondary)',
                margin: '0 8px', borderRadius: '2px'
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
      padding: '0.625rem 0.75rem', 
      border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-color)', 
      borderRadius: '0.375rem',
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
          {!isCustomer && (
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
          )}
          <div style={{ minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Reference Details</label>
            <select
              value={formData.referenceDetails?.source || formData.reference || ''}
              onChange={e => {
                const src = e.target.value;
                setFormData({
                  ...formData,
                  reference: src,
                  referenceDetails: { source: src, name: '', mobile: '' }
                });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Reference</option>
              <option value="Social Media">Social Media</option>
              <option value="Office Staff">Office Staff</option>
              <option value="Old Customer">Old Customer</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {['Office Staff', 'Old Customer', 'Friend'].includes(formData.referenceDetails?.source || formData.reference || '') && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Reference Name</label>
                <input
                  type="text"
                  value={formData.referenceDetails?.name || ''}
                  onChange={e => setFormData({
                    ...formData,
                    referenceDetails: {
                      ...(formData.referenceDetails || { source: formData.reference || '' }),
                      name: e.target.value
                    }
                  })}
                  placeholder="Enter reference person name"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Reference Mobile Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.referenceDetails?.mobile || ''}
                  onChange={e => setFormData({
                    ...formData,
                    referenceDetails: {
                      ...(formData.referenceDetails || { source: formData.reference || '' }),
                      mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                    }
                  })}
                  placeholder="10-digit mobile number"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </>
          )}
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Mobile Number * (10 digits starting with 6-9)</label>
              <input 
                type="tel" 
                maxLength={10}
                value={formData.mobile} 
                onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                placeholder="e.g. 9876543210" 
                style={getInputStyle('mobile', formData.mobile)} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Alternative Number (Optional)</label>
              <input 
                type="tel" 
                maxLength={10}
                value={formData.altMobile} 
                onChange={e => setFormData({...formData, altMobile: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                placeholder="e.g. 9876543211" 
                style={getInputStyle('altMobile', formData.altMobile)} 
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', margin: 0 }}>Aadhar Number * (12 digits)</label>
                <button
                  type="button"
                  onClick={() => { setDocUploadType('AADHAR CARD'); setIsUploadModalOpen(true); }}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    border: missingDocErrors.includes('AADHAR CARD') ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    backgroundColor: uploadedFiles['AADHAR CARD'] ? '#ecfdf5' : missingDocErrors.includes('AADHAR CARD') ? '#fee2e2' : 'var(--bg-secondary)',
                    color: uploadedFiles['AADHAR CARD'] ? '#059669' : missingDocErrors.includes('AADHAR CARD') ? '#dc2626' : 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 600
                  }}
                >
                  <Upload size={12} /> {uploadedFiles['AADHAR CARD'] ? 'Aadhaar Attached ✓' : 'Upload Aadhaar Doc *'}
                </button>
              </div>
              <input 
                type="text" 
                maxLength={12}
                value={formData.aadhar} 
                onChange={e => setFormData({...formData, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12)})} 
                placeholder="12-digit UID" 
                style={getInputStyle('aadhar', formData.aadhar)} 
              />
              {missingDocErrors.includes('AADHAR CARD') && !uploadedFiles['AADHAR CARD'] && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>Aadhaar document upload is required.</div>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', margin: 0 }}>PAN Number * (e.g. ABCDE1234F)</label>
                <button
                  type="button"
                  onClick={() => { setDocUploadType('PAN CARD'); setIsUploadModalOpen(true); }}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.25rem',
                    border: missingDocErrors.includes('PAN CARD') ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    backgroundColor: uploadedFiles['PAN CARD'] ? '#ecfdf5' : missingDocErrors.includes('PAN CARD') ? '#fee2e2' : 'var(--bg-secondary)',
                    color: uploadedFiles['PAN CARD'] ? '#059669' : missingDocErrors.includes('PAN CARD') ? '#dc2626' : 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 600
                  }}
                >
                  <Upload size={12} /> {uploadedFiles['PAN CARD'] ? 'PAN Attached ✓' : 'Upload PAN Doc *'}
                </button>
              </div>
              <input 
                type="text" 
                maxLength={10}
                value={formData.pan} 
                onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)})} 
                placeholder="ABCDE1234F" 
                style={getInputStyle('pan', formData.pan)} 
              />
              {missingDocErrors.includes('PAN CARD') && !uploadedFiles['PAN CARD'] && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>PAN document upload is required.</div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Email ID *</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value.trim()})} 
                placeholder="name@example.com" 
                style={getInputStyle('email', formData.email)} 
              />
            </div>
          </div>
        </div>

        {/* Photo & Signature Upload Area */}
        <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '100%', position: 'relative', marginTop: '2rem' }}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '3/4', 
              border: missingDocErrors.includes('CUSTOMER PHOTOGRAPH') && !uploadedFiles['CUSTOMER PHOTOGRAPH'] ? '2px solid #ef4444' : '1px solid var(--border-color)', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: missingDocErrors.includes('CUSTOMER PHOTOGRAPH') && !uploadedFiles['CUSTOMER PHOTOGRAPH'] ? '#fef2f2' : '#f8fafc', 
              overflow: 'hidden' 
            }}>
              {uploadedFiles['CUSTOMER PHOTOGRAPH'] ? (
                <img src={uploadedFiles['CUSTOMER PHOTOGRAPH']} alt="Customer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={60} color={missingDocErrors.includes('CUSTOMER PHOTOGRAPH') ? '#f87171' : '#cbd5e1'} />
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
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: missingDocErrors.includes('CUSTOMER PHOTOGRAPH') && !uploadedFiles['CUSTOMER PHOTOGRAPH'] ? '#ef4444' : 'var(--primary-dark)', textAlign: 'center' }}>
            Customer Photo *
            {missingDocErrors.includes('CUSTOMER PHOTOGRAPH') && !uploadedFiles['CUSTOMER PHOTOGRAPH'] && (
              <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 500 }}>Upload Required</div>
            )}
          </div>

          <div style={{ width: '100%', position: 'relative', marginTop: '0.5rem' }}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '2/1', 
              border: missingDocErrors.includes('CUSTOMER SIGNATURE') && !uploadedFiles['CUSTOMER SIGNATURE'] ? '2px dashed #ef4444' : '1px dashed var(--border-color)', 
              borderRadius: '0.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: missingDocErrors.includes('CUSTOMER SIGNATURE') && !uploadedFiles['CUSTOMER SIGNATURE'] ? '#fef2f2' : '#f8fafc', 
              overflow: 'hidden' 
            }}>
              {uploadedFiles['CUSTOMER SIGNATURE'] ? (
                <img src={uploadedFiles['CUSTOMER SIGNATURE']} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '0.75rem', color: missingDocErrors.includes('CUSTOMER SIGNATURE') ? '#ef4444' : 'var(--text-secondary)' }}>Signature</span>
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
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: missingDocErrors.includes('CUSTOMER SIGNATURE') && !uploadedFiles['CUSTOMER SIGNATURE'] ? '#ef4444' : 'var(--primary-dark)', textAlign: 'center' }}>
            Customer Signature *
            {missingDocErrors.includes('CUSTOMER SIGNATURE') && !uploadedFiles['CUSTOMER SIGNATURE'] && (
              <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 500 }}>Upload Required</div>
            )}
          </div>
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
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Dno (Optional)</label>
                <input type="text" placeholder="Door No" value={formData.residentialAddress.houseNo} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, houseNo: e.target.value}})} style={getInputStyle('res_houseNo', formData.residentialAddress.houseNo)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Street Name / Locality *</label>
                <input type="text" placeholder="Street Name" value={formData.residentialAddress.streetName} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, streetName: e.target.value}})} style={getInputStyle('res_streetName', formData.residentialAddress.streetName)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Area (Optional)</label>
                <input type="text" placeholder="Area" value={formData.residentialAddress.area} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, area: e.target.value}})} style={getInputStyle('res_area', formData.residentialAddress.area)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City / Town *</label>
                <input type="text" placeholder="City" value={formData.residentialAddress.city} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, city: e.target.value}})} style={getInputStyle('res_city', formData.residentialAddress.city)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk / District (Optional)</label>
                <input type="text" placeholder="Taluk / District" value={formData.residentialAddress.taluk} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, taluk: e.target.value}})} style={getInputStyle('res_taluk', formData.residentialAddress.taluk)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PinCode * (6 digits only)</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="6-digit PIN" 
                  value={formData.residentialAddress.pincode} 
                  onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)}})} 
                  style={getInputStyle('res_pincode', formData.residentialAddress.pincode)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>State *</label>
                <input type="text" placeholder="State" value={formData.residentialAddress.state} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, state: e.target.value}})} style={getInputStyle('res_state', formData.residentialAddress.state)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Landmark (Optional)</label>
                <input type="text" placeholder="Landmark" value={formData.residentialAddress.landmark} onChange={e => setFormData({...formData, residentialAddress: {...formData.residentialAddress, landmark: e.target.value}})} style={getInputStyle('res_landmark', formData.residentialAddress.landmark)} />
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div style={{ flex: 1, minWidth: '350px', backgroundColor: 'transparent', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Permanent Address *</h4>
              <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <input type="checkbox" checked={formData.permanentAddress.sameAsResidential} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, sameAsResidential: e.target.checked}})} style={{ accentColor: 'var(--primary)' }} />
                Same as Correspondence
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', opacity: formData.permanentAddress.sameAsResidential ? 0.5 : 1, pointerEvents: formData.permanentAddress.sameAsResidential ? 'none' : 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Dno (Optional)</label>
                <input type="text" placeholder="Door No" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.houseNo : formData.permanentAddress.houseNo} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, houseNo: e.target.value}})} style={getInputStyle('perm_houseNo', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.houseNo : formData.permanentAddress.houseNo)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Street Name / Locality *</label>
                <input type="text" placeholder="Street Name" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.streetName : formData.permanentAddress.streetName} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, streetName: e.target.value}})} style={getInputStyle('perm_streetName', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.streetName : formData.permanentAddress.streetName)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Area (Optional)</label>
                <input type="text" placeholder="Area" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.area : formData.permanentAddress.area} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, area: e.target.value}})} style={getInputStyle('perm_area', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.area : formData.permanentAddress.area)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City / Town *</label>
                <input type="text" placeholder="City" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.city : formData.permanentAddress.city} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, city: e.target.value}})} style={getInputStyle('perm_city', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.city : formData.permanentAddress.city)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk / District (Optional)</label>
                <input type="text" placeholder="Taluk / District" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.taluk : formData.permanentAddress.taluk} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, taluk: e.target.value}})} style={getInputStyle('perm_taluk', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.taluk : formData.permanentAddress.taluk)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PinCode * (6 digits only)</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="6-digit PIN" 
                  value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.pincode : formData.permanentAddress.pincode} 
                  onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)}})} 
                  style={getInputStyle('perm_pincode', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.pincode : formData.permanentAddress.pincode)} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>State *</label>
                <input type="text" placeholder="State" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.state : formData.permanentAddress.state} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, state: e.target.value}})} style={getInputStyle('perm_state', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.state : formData.permanentAddress.state)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Landmark (Optional)</label>
                <input type="text" placeholder="Landmark" value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.landmark : formData.permanentAddress.landmark} onChange={e => setFormData({...formData, permanentAddress: {...formData.permanentAddress, landmark: e.target.value}})} style={getInputStyle('perm_landmark', formData.permanentAddress.sameAsResidential ? formData.residentialAddress.landmark : formData.permanentAddress.landmark)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Building size={20} color="var(--primary)" /> Property Details
        </h3>
      </div>

      {/* Clear Property Ownership Document Upload Slot */}
      <div style={{ padding: '1.25rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', backgroundColor: '#f8fafc', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary)" /> Property Ownership Document (Sale Deed / Title Deed / Patta Copy)
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Upload registered Sale Deed, Title Deed, or Patta copy proving ownership of the property (PDF or Image).
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {(uploadedFiles['SALE DEED'] || uploadedFiles['LAND DOCUMENT']) ? (
            <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={16} /> Document Uploaded
            </span>
          ) : null}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setDocUploadType('SALE DEED'); setIsUploadModalOpen(true); }}
            className="btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Upload size={15} /> {(uploadedFiles['SALE DEED'] || uploadedFiles['LAND DOCUMENT']) ? 'Change Document' : 'Upload Document'}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Survey Number *</label>
          <input type="text" placeholder="e.g. 124/2A" value={formData.propertyDetails?.surveyNo || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, surveyNo: e.target.value}})} style={getInputStyle('prop_surveyNo', formData.propertyDetails?.surveyNo)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Patta Number *</label>
          <input type="text" placeholder="e.g. 8421" value={formData.propertyDetails?.pattaNo || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, pattaNo: e.target.value}})} style={getInputStyle('prop_pattaNo', formData.propertyDetails?.pattaNo)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Village (Optional)</label>
          <input type="text" placeholder="Village" value={formData.propertyDetails?.village || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, village: e.target.value}})} style={getInputStyle('prop_village', formData.propertyDetails?.village)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Panchayat (Optional)</label>
          <input type="text" placeholder="Panchayat" value={formData.propertyDetails?.panchayat || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, panchayat: e.target.value}})} style={getInputStyle('prop_panchayat', formData.propertyDetails?.panchayat)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City (Optional)</label>
          <input type="text" placeholder="City" value={formData.propertyDetails?.city || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, city: e.target.value}})} style={getInputStyle('prop_city', formData.propertyDetails?.city)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk/District (Optional)</label>
          <input type="text" placeholder="Taluk/District" value={formData.propertyDetails?.taluk || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, taluk: e.target.value}})} style={getInputStyle('prop_taluk', formData.propertyDetails?.taluk)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PinCode (Optional, 6 digits)</label>
          <input 
            type="text" 
            maxLength={6}
            placeholder="6-digit PIN" 
            value={formData.propertyDetails?.pincode || ''} 
            onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)}})} 
            style={getInputStyle('prop_pincode', formData.propertyDetails?.pincode)} 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>State (Optional)</label>
          <input type="text" placeholder="State" value={formData.propertyDetails?.state || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, state: e.target.value}})} style={getInputStyle('prop_state', formData.propertyDetails?.state)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Landmark (Optional)</label>
          <input type="text" placeholder="Landmark" value={formData.propertyDetails?.landmark || ''} onChange={e => setFormData({...formData, propertyDetails: {...formData.propertyDetails, landmark: e.target.value}})} style={getInputStyle('prop_landmark', formData.propertyDetails?.landmark)} />
        </div>
      </div>

      {/* Mandatory Property Documents Section */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--primary)" /> Required Property Documents *
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All 3 documents mandatory</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Upload clear scanned copies or images. Missing documents will block application submission.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            { key: 'SALE DEED', altKey: 'LAND DOCUMENT', title: 'Sale Deed / Land Document', desc: 'Registered document of property ownership' },
            { key: 'PATTA', altKey: '', title: 'Patta Copy', desc: 'Official revenue document / Patta copy' },
            { key: 'BUILDING PLAN', altKey: '', title: 'Proposed Building Plan', desc: 'Approved or proposed architectural plan' },
          ].map(doc => {
            const isUploaded = Boolean(uploadedFiles[doc.key as keyof typeof uploadedFiles] || (doc.altKey && uploadedFiles[doc.altKey as keyof typeof uploadedFiles]));
            const isMissing = missingDocErrors.includes(doc.key) && !isUploaded;

            return (
              <div 
                key={doc.key}
                style={{
                  padding: '1.25rem',
                  borderRadius: '0.5rem',
                  border: isMissing ? '2px solid #ef4444' : isUploaded ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  backgroundColor: isMissing ? '#fef2f2' : isUploaded ? '#f0fdf4' : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{doc.title} *</h5>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '1rem',
                      backgroundColor: isUploaded ? '#dcfce7' : isMissing ? '#fee2e2' : '#f1f5f9',
                      color: isUploaded ? '#166534' : isMissing ? '#991b1b' : '#64748b'
                    }}>
                      {isUploaded ? 'UPLOADED ✓' : isMissing ? 'MISSING *' : 'REQUIRED'}
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.desc}</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setDocUploadType(doc.key); setIsUploadModalOpen(true); }}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      backgroundColor: isUploaded ? 'white' : 'var(--primary)',
                      color: isUploaded ? 'var(--primary)' : 'white',
                      border: isUploaded ? '1px solid var(--border-color)' : 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Upload size={14} /> {isUploaded ? 'Replace Document' : 'Upload File *'}
                  </button>

                  {isUploaded && (
                    <button
                      type="button"
                      onClick={() => { setDocUploadType(doc.key); setModalTab('view'); setIsUploadModalOpen(true); }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem',
                        backgroundColor: 'white',
                        border: '1px solid var(--border-color)',
                        color: 'var(--primary)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
                {currentStep === 1 && (
                  <>
                    <option value="CUSTOMER PHOTOGRAPH">CUSTOMER PHOTOGRAPH</option>
                    <option value="CUSTOMER SIGNATURE">CUSTOMER SIGNATURE</option>
                    <option value="AADHAR CARD">AADHAR CARD</option>
                    <option value="PAN CARD">PAN CARD</option>
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <option value="LAND DOCUMENT">LAND DOCUMENT</option>
                    <option value="SALE DEED">SALE DEED</option>
                    <option value="PATTA">PATTA</option>
                    <option value="FMB">FMB</option>
                    <option value="PROPERTY SIGNATURE">SIGNATURE</option>
                    <option value="BUILDING PLAN">BUILDING PLAN</option>
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
                    if (fileData.startsWith('data:image/')) {
                      return <img src={fileData} alt="Uploaded" style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain' }} />;
                    } else if (fileData.startsWith('data:application/pdf')) {
                      return <iframe src={fileData} title="PDF Preview" style={{ width: '100%', height: '350px', border: 'none' }} />;
                    } else {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)' }}>
                           <FileText size={48} style={{ marginBottom: '1rem' }} />
                           <span style={{ fontWeight: 500 }}>Document Uploaded</span>
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

  return (
    <div style={{ paddingBottom: '3rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => isCustomer ? navigate('/') : isEmployee ? navigate('/employee/applications') : navigate('/admin/applications')}
          style={{ padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Back"
        >
          <ArrowLeft size={20} color="var(--primary-dark)" />
        </button>
        <div>
          <h2 className="heading-2" style={{ marginBottom: '0.25rem' }}>{isCustomer ? 'Start Building Approval Application' : 'New Application Process'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Step {currentStep} of {totalSteps}</p>
        </div>
      </div>

      {renderStepIndicator()}

      <div style={{ marginBottom: '2rem' }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {currentStep < totalSteps && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button 
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            style={{ 
              padding: '0.75rem 1.5rem', borderRadius: '0.5rem', 
              backgroundColor: currentStep === 1 ? 'var(--bg-secondary)' : 'var(--bg-surface)', 
              border: '1px solid var(--border-color)', 
              color: currentStep === 1 ? 'var(--text-secondary)' : 'var(--primary-dark)', 
              fontWeight: 600, cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          <button 
            type="button"
            onClick={handleNext}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}
      
      {currentStep === totalSteps && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button 
            type="button"
            onClick={handlePrev}
            style={{ 
              padding: '0.75rem 1.5rem', borderRadius: '0.5rem', 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--primary-dark)', 
              fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <ArrowLeft size={18} /> {isCustomer ? 'Back to Personal Details' : 'Back to Property Details'}
          </button>

          <button 
            type="button"
            onClick={handleSubmit}
            style={{ 
              padding: '0.75rem 2rem', 
              borderRadius: '0.5rem', 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none',
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
            }}
          >
            <CheckCircle size={18} /> Submit Application
          </button>
        </div>
      )}
      
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

      {/* Floating Submit/Save Button (Step 3 or Step 2 if Customer) */}
      {(currentStep === totalSteps) && (
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
          {!isCustomer && isSaveMenuOpen && (
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
            type="button"
            onClick={handleSubmit}
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
        </div>
      )}
    </div>
  );
};

export default NewApplication;
