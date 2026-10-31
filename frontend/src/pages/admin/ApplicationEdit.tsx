import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Building, Phone, Mail, MapPin, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const ApplicationEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const loggedInUser = localStorage.getItem('loggedInUser') || '';
  const userRole = localStorage.getItem('userRole') || (loggedInUser === 'Admin' ? 'ADMIN' : 'STAFF');
  const isAdmin = userRole === 'ADMIN' || loggedInUser === 'Admin';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [caseRecord, setCaseRecord] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customerName: '',
    fatherName: '',
    dob: '',
    mobile: '',
    altMobile: '',
    email: '',
    aadhar: '',
    pan: '',
    serviceType: 'building',
    staff: 'Unassigned',
    assignedStaffId: null as string | null,
    residentialAddress: {
      houseNo: '',
      streetName: '',
      area: '',
      city: '',
      taluk: '',
      pincode: '',
      state: 'Tamil Nadu',
      landmark: ''
    },
    permanentAddress: {
      sameAsResidential: true,
      houseNo: '',
      streetName: '',
      area: '',
      city: '',
      taluk: '',
      pincode: '',
      state: 'Tamil Nadu',
      landmark: ''
    },
    propertyDetails: {
      surveyNo: '',
      pattaNo: '',
      village: '',
      panchayat: '',
      city: '',
      taluk: '',
      pincode: '',
      state: 'Tamil Nadu',
      landmark: ''
    }
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/users`);
        if (res.ok) {
          const list = await res.json();
          setStaffList(list.filter((u: any) => u.status === 'Active' && u.role === 'STAFF'));
        }
      } catch (e) {
        console.error('Failed to fetch staff list', e);
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/cases/${id}`, {
          headers: {
            'x-user-role': 'ADMIN',
            'x-user-name': loggedInUser
          }
        });

        if (res.ok) {
          const c = await res.json();
          setCaseRecord(c);

          const full = c.fullData || {};
          const prop = c.property || {};
          const resAddr = full.residentialAddress || {};
          const permAddr = full.permanentAddress || {};
          const propDetails = full.propertyDetails || {};

          setFormData({
            customerName: prop.owner_name || full.customerName || '',
            fatherName: full.fatherName || '',
            dob: full.dob || '',
            mobile: (prop.owner_phone || full.mobile || '').replace(/\D/g, '').slice(-10),
            altMobile: (full.altMobile || '').replace(/\D/g, '').slice(-10),
            email: prop.owner_email || full.email || '',
            aadhar: full.aadhar || '',
            pan: (full.pan || '').toUpperCase(),
            serviceType: full.serviceType || c.approval_type || 'building',
            staff: c.assigned_staff?.name || full.staff || 'Unassigned',
            assignedStaffId: c.assigned_staff_id || null,
            residentialAddress: {
              houseNo: resAddr.houseNo || resAddr.dno || '',
              streetName: resAddr.streetName || '',
              area: resAddr.area || '',
              city: resAddr.city || '',
              taluk: resAddr.taluk || '',
              pincode: (resAddr.pincode || '').replace(/\D/g, '').slice(0, 6),
              state: resAddr.state || 'Tamil Nadu',
              landmark: resAddr.landmark || ''
            },
            permanentAddress: {
              sameAsResidential: permAddr.sameAsResidential !== undefined ? Boolean(permAddr.sameAsResidential) : true,
              houseNo: permAddr.houseNo || '',
              streetName: permAddr.streetName || '',
              area: permAddr.area || '',
              city: permAddr.city || '',
              taluk: permAddr.taluk || '',
              pincode: (permAddr.pincode || '').replace(/\D/g, '').slice(0, 6),
              state: permAddr.state || 'Tamil Nadu',
              landmark: permAddr.landmark || ''
            },
            propertyDetails: {
              surveyNo: prop.survey_number || propDetails.surveyNo || '',
              pattaNo: propDetails.pattaNo || '',
              village: prop.village || propDetails.village || '',
              panchayat: prop.jurisdiction || propDetails.panchayat || '',
              city: prop.city || propDetails.city || '',
              taluk: prop.taluk || propDetails.taluk || '',
              pincode: (propDetails.pincode || '').replace(/\D/g, '').slice(0, 6),
              state: propDetails.state || 'Tamil Nadu',
              landmark: propDetails.landmark || ''
            }
          });
        } else {
          toast.error('Failed to load application data from database.');
        }
      } catch (e: any) {
        console.error('Error fetching case:', e);
        toast.error('Error connecting to database.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseDetails();
  }, [id, loggedInUser]);

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '650px', margin: '4rem auto', padding: '2.5rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fca5a5', textAlign: 'center' }}>
        <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>Access Restricted</h2>
        <p style={{ color: '#b91c1c', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
          Only System Administrators have permission to edit customer application details. Workers and customers are restricted from modifying customer information.
        </p>
        <button 
          onClick={() => navigate(userRole === 'STAFF' ? '/employee/applications' : '/admin/applications')}
          className="btn-primary"
          style={{ padding: '0.625rem 1.5rem' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>Loading application details...</div>
      </div>
    );
  }

  const getInputStyle = (fieldName: string, value: any) => {
    const hasError = formErrors.includes(fieldName);
    return {
      width: '100%',
      padding: '0.625rem 0.75rem',
      borderRadius: '0.375rem',
      border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
      backgroundColor: hasError ? '#fef2f2' : 'var(--bg-surface)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      outline: 'none',
      boxSizing: 'border-box' as const
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!formData.customerName.trim()) errors.push('customerName');

    // Strict 10-digit mobile starting with 6-9
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.push('mobile');
      toast.error('Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.');
    }

    if (formData.altMobile) {
      const cleanAlt = formData.altMobile.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
        errors.push('altMobile');
        toast.error('Alternative mobile must be exactly 10 digits starting with 6, 7, 8, or 9.');
      }
    }

    if (formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.push('email');
        toast.error('Please enter a valid email address.');
      }
    }

    // Strict 6-digit PIN code
    const resPin = formData.residentialAddress.pincode.replace(/\D/g, '');
    if (!resPin || !/^\d{6}$/.test(resPin)) {
      errors.push('res_pincode');
      toast.error('Residential address PIN code must be exactly 6 digits.');
    }

    if (!formData.permanentAddress.sameAsResidential) {
      const permPin = formData.permanentAddress.pincode.replace(/\D/g, '');
      if (!permPin || !/^\d{6}$/.test(permPin)) {
        errors.push('perm_pincode');
        toast.error('Permanent address PIN code must be exactly 6 digits.');
      }
    }

    if (formData.propertyDetails.pincode) {
      const propPin = formData.propertyDetails.pincode.replace(/\D/g, '');
      if (!/^\d{6}$/.test(propPin)) {
        errors.push('prop_pincode');
        toast.error('Property PIN code must be exactly 6 digits.');
      }
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);
    setIsSaving(true);

    try {
      const apiUrl = getApiUrl();
      const targetId = caseRecord?.id || id;

      const payload = {
        customerName: formData.customerName.trim(),
        mobile: cleanMobile,
        email: formData.email.trim(),
        fatherName: formData.fatherName.trim(),
        dob: formData.dob,
        altMobile: formData.altMobile.replace(/\D/g, ''),
        aadhar: formData.aadhar.trim(),
        pan: formData.pan.trim().toUpperCase(),
        serviceType: formData.serviceType,
        staff: formData.staff,
        assigned_staff_id: formData.assignedStaffId,
        residentialAddress: formData.residentialAddress,
        permanentAddress: formData.permanentAddress.sameAsResidential
          ? { ...formData.residentialAddress, sameAsResidential: true }
          : formData.permanentAddress,
        propertyDetails: formData.propertyDetails,
        property: {
          update: {
            owner_name: formData.customerName.trim(),
            owner_phone: cleanMobile,
            owner_email: formData.email.trim(),
            survey_number: formData.propertyDetails.surveyNo || 'TBD',
            jurisdiction: formData.propertyDetails.panchayat || 'DTCP',
            village: formData.propertyDetails.village || '',
            taluk: formData.propertyDetails.taluk || '',
            address: `${formData.propertyDetails.surveyNo ? 'Survey No: ' + formData.propertyDetails.surveyNo + ', ' : ''}${formData.propertyDetails.village ? formData.propertyDetails.village + ', ' : ''}${formData.propertyDetails.city ? formData.propertyDetails.city : ''}`
          }
        }
      };

      const res = await fetch(`${apiUrl}/cases/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
          'x-user-name': loggedInUser
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Customer details updated successfully in the database!');
        // Update local mock cache for seamless sync
        try {
          const localStr = localStorage.getItem('mock_saved_cases');
          if (localStr) {
            let cases = JSON.parse(localStr);
            cases = cases.map((c: any) => {
              if (c.id === targetId || c.application_number === targetId || c.application_number === id) {
                return {
                  ...c,
                  fullData: { ...(c.fullData || {}), ...payload },
                  property: { ...(c.property || {}), owner_name: payload.customerName, owner_phone: payload.mobile, owner_email: payload.email }
                };
              }
              return c;
            });
            localStorage.setItem('mock_saved_cases', JSON.stringify(cases));
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {}

        navigate(`/admin/applications/${id}/view`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update customer details.');
      }
    } catch (e: any) {
      console.error('Error saving customer edits:', e);
      toast.error('Network error while saving details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(`/admin/applications/${id}/view`)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
            title="Back to View"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="heading-2" style={{ margin: 0 }}>Edit Customer Application Details</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Proposal No: <strong style={{ color: 'var(--primary)' }}>{caseRecord?.application_number || id}</strong> • Permanent Database Update
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate(`/admin/applications/${id}/view`)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
            style={{
              padding: '0.625rem 1.75rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            <Save size={16} /> {isSaving ? 'Saving Changes...' : 'Save Permanently'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Personal & Contact Information */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" /> Customer Personal & Contact Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Full customer name"
                style={getInputStyle('customerName', formData.customerName)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Mobile Number * (10 Digits starting with 6-9)
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="e.g. 9876543210"
                style={getInputStyle('mobile', formData.mobile)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value.trim() })}
                placeholder="customer@example.com"
                style={getInputStyle('email', formData.email)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Alternative Phone (Optional)
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formData.altMobile}
                onChange={e => setFormData({ ...formData, altMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="Alternative 10-digit number"
                style={getInputStyle('altMobile', formData.altMobile)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Father / Guardian Name
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                placeholder="Father or spouse name"
                style={getInputStyle('fatherName', formData.fatherName)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                style={getInputStyle('dob', formData.dob)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                maxLength={12}
                value={formData.aadhar}
                onChange={e => setFormData({ ...formData, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                placeholder="12-digit UID"
                style={getInputStyle('aadhar', formData.aadhar)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                PAN Number (e.g. ABCDE1234F)
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan}
                onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                placeholder="ABCDE1234F"
                style={getInputStyle('pan', formData.pan)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Worker Assignment & Approval Type */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} color="var(--primary)" /> Worker Assignment & Service Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Assigned Worker (Admin Controlled)
              </label>
              <select
                value={formData.staff}
                onChange={e => {
                  const selectedName = e.target.value;
                  const staffObj = staffList.find(s => s.name === selectedName);
                  setFormData({
                    ...formData,
                    staff: selectedName,
                    assignedStaffId: staffObj ? staffObj.id : null
                  });
                }}
                style={getInputStyle('staff', formData.staff)}
              >
                <option value="Unassigned">Unassigned (Pending Manual Assignment)</option>
                {staffList.map((s: any) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.staffId || 'Worker'})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Only the assigned worker and Admin can see and process this application.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Service Type
              </label>
              <select
                value={formData.serviceType}
                onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                style={getInputStyle('serviceType', formData.serviceType)}
              >
                <option value="building">Building Approval</option>
                <option value="plan">Plan Approval</option>
                <option value="occupancy">Occupancy Certificate</option>
                <option value="regularisation">Regularisation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Residential & Permanent Address */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--primary)" /> Address Information (Strict 6-Digit PIN Code)
          </h3>

          {/* Residential Address */}
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            Correspondence / Residential Address
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Door No</label>
              <input
                type="text"
                placeholder="D.No"
                value={formData.residentialAddress.houseNo}
                onChange={e => setFormData({ ...formData, residentialAddress: { ...formData.residentialAddress, houseNo: e.target.value } })}
                style={getInputStyle('res_houseNo', formData.residentialAddress.houseNo)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Street / Locality</label>
              <input
                type="text"
                placeholder="Street Name"
                value={formData.residentialAddress.streetName}
                onChange={e => setFormData({ ...formData, residentialAddress: { ...formData.residentialAddress, streetName: e.target.value } })}
                style={getInputStyle('res_streetName', formData.residentialAddress.streetName)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Area</label>
              <input
                type="text"
                placeholder="Area"
                value={formData.residentialAddress.area}
                onChange={e => setFormData({ ...formData, residentialAddress: { ...formData.residentialAddress, area: e.target.value } })}
                style={getInputStyle('res_area', formData.residentialAddress.area)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City / Town</label>
              <input
                type="text"
                placeholder="City"
                value={formData.residentialAddress.city}
                onChange={e => setFormData({ ...formData, residentialAddress: { ...formData.residentialAddress, city: e.target.value } })}
                style={getInputStyle('res_city', formData.residentialAddress.city)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Taluk / District</label>
              <input
                type="text"
                placeholder="Taluk"
                value={formData.residentialAddress.taluk}
                onChange={e => setFormData({ ...formData, residentialAddress: { ...formData.residentialAddress, taluk: e.target.value } })}
                style={getInputStyle('res_taluk', formData.residentialAddress.taluk)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PIN Code * (Exactly 6 Digits)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit PIN"
                value={formData.residentialAddress.pincode}
                onChange={e => setFormData({ ...formData, residentialAddress: { ...formData.residentialAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
                style={getInputStyle('res_pincode', formData.residentialAddress.pincode)}
                required
              />
            </div>
          </div>

          {/* Permanent Address */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Permanent Address</h4>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.permanentAddress.sameAsResidential}
                onChange={e => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, sameAsResidential: e.target.checked } })}
                style={{ accentColor: 'var(--primary)' }}
              />
              Same as Correspondence Address
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', opacity: formData.permanentAddress.sameAsResidential ? 0.5 : 1, pointerEvents: formData.permanentAddress.sameAsResidential ? 'none' : 'auto' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Door No</label>
              <input
                type="text"
                placeholder="D.No"
                value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.houseNo : formData.permanentAddress.houseNo}
                onChange={e => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, houseNo: e.target.value } })}
                style={getInputStyle('perm_houseNo', formData.permanentAddress.houseNo)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Street / Locality</label>
              <input
                type="text"
                placeholder="Street Name"
                value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.streetName : formData.permanentAddress.streetName}
                onChange={e => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, streetName: e.target.value } })}
                style={getInputStyle('perm_streetName', formData.permanentAddress.streetName)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>City / Town</label>
              <input
                type="text"
                placeholder="City"
                value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.city : formData.permanentAddress.city}
                onChange={e => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, city: e.target.value } })}
                style={getInputStyle('perm_city', formData.permanentAddress.city)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PIN Code * (Exactly 6 Digits)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit PIN"
                value={formData.permanentAddress.sameAsResidential ? formData.residentialAddress.pincode : formData.permanentAddress.pincode}
                onChange={e => setFormData({ ...formData, permanentAddress: { ...formData.permanentAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
                style={getInputStyle('perm_pincode', formData.permanentAddress.pincode)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Property Details */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} color="var(--primary)" /> Property Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Survey Number *
              </label>
              <input
                type="text"
                value={formData.propertyDetails.surveyNo}
                onChange={e => setFormData({ ...formData, propertyDetails: { ...formData.propertyDetails, surveyNo: e.target.value } })}
                placeholder="e.g. 124/2A"
                style={getInputStyle('prop_surveyNo', formData.propertyDetails.surveyNo)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Patta Number *
              </label>
              <input
                type="text"
                value={formData.propertyDetails.pattaNo}
                onChange={e => setFormData({ ...formData, propertyDetails: { ...formData.propertyDetails, pattaNo: e.target.value } })}
                placeholder="e.g. 8421"
                style={getInputStyle('prop_pattaNo', formData.propertyDetails.pattaNo)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Village
              </label>
              <input
                type="text"
                value={formData.propertyDetails.village}
                onChange={e => setFormData({ ...formData, propertyDetails: { ...formData.propertyDetails, village: e.target.value } })}
                placeholder="Village"
                style={getInputStyle('prop_village', formData.propertyDetails.village)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Panchayat / Local Body
              </label>
              <input
                type="text"
                value={formData.propertyDetails.panchayat}
                onChange={e => setFormData({ ...formData, propertyDetails: { ...formData.propertyDetails, panchayat: e.target.value } })}
                placeholder="e.g. DTCP / Panchayat"
                style={getInputStyle('prop_panchayat', formData.propertyDetails.panchayat)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                Property PIN Code (6 Digits)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.propertyDetails.pincode}
                onChange={e => setFormData({ ...formData, propertyDetails: { ...formData.propertyDetails, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
                placeholder="6-digit PIN"
                style={getInputStyle('prop_pincode', formData.propertyDetails.pincode)}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(`/admin/applications/${id}/view`)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            <CheckCircle2 size={18} /> {isSaving ? 'Saving Changes...' : 'Save Customer Details'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationEdit;
