import React, { useState, useEffect } from 'react';
import { FileText, Eye, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterReportType, setFilterReportType] = useState('Approval Register');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterFileType, setFilterFileType] = useState('All');

  const [isReportVisible, setIsReportVisible] = useState(false);

  const [currentMonthYear, setCurrentMonthYear] = useState('');
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);

  useEffect(() => {
    // Load custom file types
    const savedFileTypesStr = localStorage.getItem('customFileTypes');
    if (savedFileTypesStr) {
      setAvailableFileTypes(JSON.parse(savedFileTypesStr));
    } else {
      setAvailableFileTypes(['Building Plan Approval', 'Layout Approval', 'Completion Certificate', 'Patta Transfer']);
    }

    const fetchReport = async () => {
      try {
        const apiUrl = getApiUrl();

        // Fetch all API cases
        let apiCases: any[] = [];
        try {
          const res = await fetch(`${apiUrl}/cases`);
          if (res.ok) {
            apiCases = await res.json();
          }
        } catch (e) {
          console.error("API cases fetch failed", e);
        }

        // Fetch local cases
        const localCasesStr = localStorage.getItem('mock_saved_cases');
        const localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];

        // Prioritize API cases from MongoDB
        const allCases = [...apiCases, ...localCases];

        // Remove duplicates based on ID
        const uniqueCases = allCases.filter((app: any, index: number, self: any[]) =>
          index === self.findIndex((a: any) => (a.application_number || a.id) === (app.application_number || app.id))
        );

        const formattedData = uniqueCases.map((c: any, index: number) => {
          const dateObj = new Date(c.created_at || Date.now());
          const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

          let username = '';
          let password = '';
          if (c.uploadedFiles) {
            username = c.uploadedFiles.username || '';
            password = c.uploadedFiles.password || '';
          }

          const fullData = c.fullData || {};
          const propDetails = fullData.propertyDetails || {};
          const reference = fullData.reference || '';

          return {
            sno: index + 1,
            date: dateStr,
            rawDate: dateObj, // for filtering
            fileNo: c.application_number || c.id || '-',
            name: c.property?.owner_name || fullData.customerName || '-',
            mobile: c.property?.owner_phone || fullData.mobile || '-',
            village: c.property?.village || propDetails.village || '-',
            panchayat: c.fullData?.propertyDetails?.city || c.property?.city || c.property?.jurisdiction || propDetails.panchayat || '-',
            reference: reference || '-',
            fileType: c.approval_type || fullData.serviceType || '-',
            fileStatus: c.status || '-',
            userPass: (username || password) ? `${username} / ${password}` : '-',
            status: c.uploadedFiles && Object.keys(c.uploadedFiles).length > 0 ? 'Uploaded' : 'Pending'
          };
        });

        setReportData(formattedData);

        // Set subtitle month-year
        const date = new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        setCurrentMonthYear(`${monthNames[date.getMonth()]} - ${date.getFullYear()}`);

      } catch (err) {
        console.error("Error fetching report data:", err);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const handleView = () => {
    setIsReportVisible(true);
  };

  const getFilteredData = () => {
    return reportData.filter(row => {
      if (filterFromDate) {
        const from = new Date(filterFromDate);
        from.setHours(0, 0, 0, 0);
        if (row.rawDate < from) return false;
      }
      if (filterToDate) {
        const to = new Date(filterToDate);
        to.setHours(23, 59, 59, 999);
        if (row.rawDate > to) return false;
      }
      if (filterFileType !== 'All' && row.fileType !== filterFileType) return false;
      return true;
    }).map((row, idx) => ({ ...row, sno: idx + 1 })); // recalculate S.NO
  };

  const handleExport = () => {
    const dataToExport = getFilteredData();
    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['S.NO', 'DATE', 'FILE NO', 'NAME', 'MOBILE NO', 'VILLAGE NAME', 'PANCHYAT', 'REFERENCE BY', 'FILE TYPE', 'FILE STATUS', 'USER ID & PASSWORD', 'STATUS'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        `"${row.sno}","${row.date}","${row.fileNo}","${row.name}","${row.mobile}","${row.village}","${row.panchayat}","${row.reference}","${row.fileType}","${row.fileStatus}","${row.userPass}","${row.status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Online_Approval_Register_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Excel (CSV) exported successfully');
    }
  };

  const handleExportPDF = () => {
    const dataToExport = getFilteredData();
    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Approval Register Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; }
              th, td { border: 1px solid #000; padding: 6px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h2, h3 { text-align: center; margin: 5px 0; }
              h3 { margin-bottom: 20px; color: #555; }
            </style>
          </head>
          <body>
            <h2>ONLINE APPROVAL REGISTER</h2>
            <h3>${currentMonthYear} - FILE DETAILS</h3>
            <table>
              <thead>
                <tr>
                  <th>S.NO</th><th>DATE</th><th>FILE NO</th><th>NAME</th><th>MOBILE NO</th><th>VILLAGE NAME</th><th>PANCHYAT</th><th>REFERENCE BY</th><th>FILE TYPE</th><th>FILE STATUS</th><th>USER ID & PASSWORD</th><th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${dataToExport.map(row => `
                  <tr>
                    <td>${row.sno}</td><td>${row.date}</td><td>${row.fileNo}</td><td>${row.name}</td><td>${row.mobile}</td><td>${row.village}</td><td>${row.panchayat}</td><td>${row.reference}</td><td>${row.fileType}</td><td>${row.fileStatus}</td><td>${row.userPass}</td><td>${row.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div>
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Report Filters</h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Report Type</label>
            <select value={filterReportType} onChange={(e) => setFilterReportType(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff' }}>
              <option value="Approval Register">Approval Register</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>From Date</label>
            <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>To Date</label>
            <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>File Type</label>
            <select value={filterFileType} onChange={(e) => setFilterFileType(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff' }}>
              <option value="All">All</option>
              {availableFileTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={handleView} className="btn-primary" style={{ padding: '0.625rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} /> View Report
            </button>
          </div>
        </div>
      </div>

      {isReportVisible && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)' }}>Approval Register</h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#10b981' }}>
                <FileDown size={16} /> Download Excel
              </button>
              <button onClick={handleExportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#ef4444' }}>
                <FileText size={16} /> Download PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading register data...</div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th colSpan={12} style={{ padding: '0.5rem', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', border: '1px solid #000', backgroundColor: '#fff' }}>ONLINE APPROVAL REGISTER</th>
                  </tr>
                  <tr>
                    <th colSpan={12} style={{ padding: '0.5rem', fontWeight: 600, color: '#0056b3', borderBottom: '1px solid #000', border: '1px solid #000', backgroundColor: '#fff' }}>{currentMonthYear} - FILE DETAILS</th>
                  </tr>
                  <tr style={{ backgroundColor: '#fff' }}>
                    {['S.NO', 'DATE', 'FILE NO', 'NAME', 'MOBILE NO', 'VILLAGE NAME', 'PANCHYAT', 'REFERENCE BY', 'FILE TYPE', 'FILE STATUS', 'USER ID & PASSWORD', 'STATUS'].map((header, idx) => (
                      <th key={idx} style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'red', border: '1px solid #000', whiteSpace: 'nowrap' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData().length > 0 ? getFilteredData().map((row) => (
                    <tr key={row.sno} style={{ backgroundColor: '#fff' }}>
                      <td style={{ padding: '0.5rem', border: '1px solid #000', fontWeight: 600 }}>{row.sno}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.date}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000', fontWeight: 500 }}>{row.fileNo}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.name}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.mobile}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.village}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.panchayat}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.reference}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.fileType}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.fileStatus}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.userPass}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.status}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid #000' }}>
                        No application records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
