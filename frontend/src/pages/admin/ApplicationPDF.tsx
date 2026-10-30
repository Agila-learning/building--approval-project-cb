import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { recentApplications } from '../../data/mockData';
import { getApiUrl } from '../../config/api';

const ApplicationPDF: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const previewStr = localStorage.getItem('print_preview_data');
      if (previewStr) {
        setAppData(JSON.parse(previewStr));
        return;
      }

      const existingStr = localStorage.getItem('mock_saved_cases');
      if (existingStr) {
        const existing = JSON.parse(existingStr);
        const app = existing.find((a: any) => a.id === id);
        if (app && app.fullData) {
          setAppData(app.fullData);
          return;
        }
      }

      const fetchFromApi = async () => {
        try {
          const apiUrl = getApiUrl();
          const res = await fetch(`${apiUrl}/cases/${id}`);
          if (res.ok) {
            const c = await res.json();
            if (c.fullData) {
              setAppData(c.fullData);
              return;
            }
            if (c.property) {
              setAppData({
                customerName: c.property.owner_name,
                serviceType: c.approval_type,
                mobile: c.property.owner_phone,
                email: c.property.owner_email || '',
                propertyDetails: {
                  surveyNo: c.property.survey_number || '',
                  dno: c.property.address || '',
                  village: c.property.village || '',
                  taluk: c.property.taluk || '',
                },
                uploadedFiles: c.uploadedFiles || {}
              });
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchFromApi();

      const apiApp = recentApplications.find((a: any) => a.id === id);
      if (apiApp) {
        setAppData({
          customerName: apiApp.customer,
          serviceType: apiApp.approval_type,
          mobile: '',
          email: '',
          aadhar: '',
          pan: '',
          dob: '',
          fatherName: '',
          residentialAddress: { houseNo: '', streetName: '', area: apiApp.location || '', city: '', taluk: '', pincode: '', state: '' },
          propertyDetails: { surveyNo: '', pattaNo: '', dno: '', streetName: '', village: '', panchayat: '', city: '', taluk: '', pincode: '', state: '', landmark: '' },
          feesAmount: '',
          uploadedFiles: {}
        });
      }
    }
  }, [id]);

  useEffect(() => {
    if (appData) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [appData]);

  if (!appData) return <div style={{ padding: '2rem' }}>Loading application data...</div>;

  const files = appData.uploadedFiles || {};
  const photo = files['CUSTOMER PHOTOGRAPH'];
  const signature = files['CUSTOMER SIGNATURE'] || files['PROPERTY SIGNATURE'];

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '20px', fontFamily: '"Arial", sans-serif', color: 'black' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', border: '2px solid black' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', borderBottom: '2px solid black' }}>
          {/* Logo */}
          <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid black' }}>
            <img src="/assets/logo.jpeg" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '5px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>CB Building Approval</div>
          </div>
          
          {/* Middle Info */}
          <div style={{ flex: 2, padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid black', fontSize: '12px', lineHeight: '1.5' }}>
            <div><strong>BRANCH CODE :</strong> MAIN</div>
            <div><strong>APPLICATION FOR</strong></div>
            <div style={{ marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
              {appData.serviceType === 'building' ? 'BUILDING PLAN APPROVAL' : 'PLANNING PERMISSION'}
            </div>
          </div>
          
          {/* Applicant Photo */}
          <div style={{ flex: 1, padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid black', padding: '5px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>APPLICANT</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
              {photo ? (
                <img src={photo} alt="Applicant" style={{ width: '100px', height: '120px', objectFit: 'cover', border: '1px solid #ccc' }} />
              ) : (
                <div style={{ width: '100px', height: '120px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888' }}>Photo Area</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid black' }}>
          <div style={{ flex: 1, padding: '5px', fontSize: '12px', borderRight: '1px solid black' }}><strong>Date :</strong> {new Date().toLocaleDateString()}</div>
          <div style={{ flex: 2, padding: '5px', fontSize: '10px', textAlign: 'center', borderRight: '1px solid black' }}>Complete in all respects in BLOCK letters.</div>
          <div style={{ flex: 1, padding: '5px', fontSize: '10px', textAlign: 'center', color: '#555' }}>APPLICANT SIGNATURE</div>
        </div>

        {/* PERSONAL DETAILS TITLE */}
        <div style={{ backgroundColor: 'black', color: 'white', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
          PERSONAL DETAILS
        </div>

        {/* Table Rows for Personal Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '12px' }}>
          {/* Applicant Details Column */}
          <div style={{ borderRight: '1px solid black' }}>
             <div style={{ backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid black' }}>APPLICANT DETAILS</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>NAME:</strong> {appData.customerName?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>FATHER NAME:</strong> {appData.fatherName?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>PAN NO:</strong> {appData.pan?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>AADHAAR NO:</strong> {appData.aadhar?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>DATE OF BIRTH:</strong> {appData.dob || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>PHONE/MOBILE:</strong> {appData.mobile || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>EMAIL ID:</strong> {appData.email || '-'}</div>
          </div>
          {/* Property Details Column */}
          <div>
             <div style={{ backgroundColor: '#e2e8f0', padding: '4px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid black' }}>PROPERTY DETAILS</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>SURVEY NO:</strong> {appData.propertyDetails?.surveyNo || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>PATTA NO:</strong> {appData.propertyDetails?.pattaNo || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>VILLAGE / AREA:</strong> {appData.propertyDetails?.village?.toUpperCase() || appData.propertyDetails?.area?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>PANCHAYAT:</strong> {appData.propertyDetails?.panchayat?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>TALUK:</strong> {appData.propertyDetails?.taluk?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>CITY:</strong> {appData.propertyDetails?.city?.toUpperCase() || '-'}</div>
             <div style={{ padding: '4px', borderBottom: '1px solid black' }}><strong>PINCODE:</strong> {appData.propertyDetails?.pincode || '-'}</div>
          </div>
        </div>

        {/* Addresses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '12px', borderTop: '1px solid black', borderBottom: '1px solid black' }}>
          <div style={{ borderRight: '1px solid black', padding: '4px' }}>
            <strong>RESIDENTIAL ADDRESS:</strong><br/>
            {appData.residentialAddress?.houseNo} {appData.residentialAddress?.streetName}<br/>
            {appData.residentialAddress?.area}, {appData.residentialAddress?.city}<br/>
            {appData.residentialAddress?.state} - {appData.residentialAddress?.pincode}
          </div>
          <div style={{ padding: '4px' }}>
             <strong>PROPERTY ADDRESS:</strong><br/>
             {appData.propertyDetails?.dno} {appData.propertyDetails?.streetName}<br/>
             {appData.propertyDetails?.village}, {appData.propertyDetails?.city}<br/>
             {appData.propertyDetails?.state} - {appData.propertyDetails?.pincode}
          </div>
        </div>

        {/* Fees and Signature */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '12px' }}>
          <div style={{ borderRight: '1px solid black', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>FEES DETAILS:</div>
            <div><strong>Amount:</strong> ₹{appData.feesAmount || '0'}</div>
            {appData.feeNotes && <div style={{ marginTop: '5px' }}><strong>Notes:</strong> {appData.feeNotes}</div>}
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minHeight: '120px' }}>
             {signature ? (
               <img src={signature} alt="Signature" style={{ width: '150px', height: 'auto', maxHeight: '80px', objectFit: 'contain', borderBottom: '1px solid #ccc' }} />
             ) : (
               <div style={{ width: '150px', height: '40px', borderBottom: '1px solid #ccc' }}></div>
             )}
             <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '10px' }}>CUSTOMER SIGNATURE</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApplicationPDF;
