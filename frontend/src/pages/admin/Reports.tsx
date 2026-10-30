import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Eye, FileDown, Users, Award, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

interface StaffPerfMetric {
  sno: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  totalCases: number;
  inProgressCases: number;
  approvedCases: number;
  rejectedCases: number;
  pendingDocsCases: number;
  leadsAssigned: number;
  leadsCompleted: number;
  completionRate: number;
  status: string;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [rawCases, setRawCases] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterReportType, setFilterReportType] = useState('Approval Register');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterFileType, setFilterFileType] = useState('All');
  const [filterStaff, setFilterStaff] = useState('All');

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

    const fetchAllData = async () => {
      try {
        const apiUrl = getApiUrl();

        // 1. Fetch Users / Staff
        try {
          const userRes = await fetch(`${apiUrl}/users`);
          if (userRes.ok) {
            const users = await userRes.json();
            setStaffList(users.filter((u: any) => u.role === 'STAFF' || u.role === 'Staff'));
          }
        } catch (e) {
          console.error("Failed to fetch staff members", e);
        }

        // 2. Fetch Leads
        try {
          const leadsRes = await fetch(`${apiUrl}/leads`);
          if (leadsRes.ok) {
            const leads = await leadsRes.json();
            setLeadsList(leads);
          }
        } catch (e) {
          console.error("Failed to fetch leads", e);
        }

        // 3. Fetch Cases
        let apiCases: any[] = [];
        try {
          const res = await fetch(`${apiUrl}/cases`);
          if (res.ok) {
            apiCases = await res.json();
          }
        } catch (e) {
          console.error("API cases fetch failed", e);
        }

        const localCasesStr = localStorage.getItem('mock_saved_cases');
        const localCases = localCasesStr ? JSON.parse(localCasesStr).filter((c: any) => c.type !== 'Lead') : [];

        const allCases = [...apiCases, ...localCases];
        const uniqueCases = allCases.filter((app: any, index: number, self: any[]) =>
          index === self.findIndex((a: any) => (a.application_number || a.id) === (app.application_number || app.id))
        );

        setRawCases(uniqueCases);

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
            rawDate: dateObj,
            fileNo: c.application_number || c.id || '-',
            name: c.property?.owner_name || fullData.customerName || '-',
            mobile: c.property?.owner_phone || fullData.mobile || '-',
            village: c.property?.village || propDetails.village || '-',
            panchayat: c.fullData?.propertyDetails?.city || c.property?.city || c.property?.jurisdiction || propDetails.panchayat || '-',
            reference: reference || '-',
            fileType: c.approval_type || fullData.serviceType || '-',
            fileStatus: c.status || '-',
            staffName: c.assigned_staff?.name || fullData.staff || 'Unassigned',
            staffId: c.assigned_staff_id || '',
            userPass: (username || password) ? `${username} / ${password}` : '-',
            status: c.uploadedFiles && Object.keys(c.uploadedFiles).length > 0 ? 'Uploaded' : 'Pending'
          };
        });

        setReportData(formattedData);

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

    fetchAllData();
  }, []);

  const handleView = () => {
    setIsReportVisible(true);
  };

  // Filtered Register Data
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
    }).map((row, idx) => ({ ...row, sno: idx + 1 }));
  };

  // Aggregated Staff Performance Metrics
  const staffPerformanceData = useMemo<StaffPerfMetric[]>(() => {
    // Collect all candidate staff from staffList and unique case staff names
    const staffMap = new Map<string, { id: string; name: string; email: string; phone: string }>();

    staffList.forEach(s => {
      const nameKey = (s.name || '').trim().toLowerCase();
      if (nameKey) {
        staffMap.set(nameKey, {
          id: s.id,
          name: s.name,
          email: s.email || '—',
          phone: s.phone || s.mobile || '—'
        });
      }
    });

    // Also include any staff assigned in raw cases not in staffList
    rawCases.forEach(c => {
      const staffName = c.assigned_staff?.name || c.fullData?.staff;
      if (staffName && staffName !== 'Unassigned') {
        const nameKey = staffName.trim().toLowerCase();
        if (!staffMap.has(nameKey)) {
          staffMap.set(nameKey, {
            id: c.assigned_staff_id || '',
            name: staffName,
            email: c.assigned_staff?.email || '—',
            phone: '—'
          });
        }
      }
    });

    const metrics: StaffPerfMetric[] = [];
    let idx = 1;

    staffMap.forEach((staffInfo, nameKey) => {
      // Filter by staff dropdown
      if (filterStaff !== 'All' && staffInfo.name.toLowerCase() !== filterStaff.toLowerCase()) {
        return;
      }

      // Cases assigned to this staff
      const assignedCases = rawCases.filter(c => {
        const cDate = new Date(c.created_at || Date.now());
        if (filterFromDate) {
          const from = new Date(filterFromDate);
          from.setHours(0, 0, 0, 0);
          if (cDate < from) return false;
        }
        if (filterToDate) {
          const to = new Date(filterToDate);
          to.setHours(23, 59, 59, 999);
          if (cDate > to) return false;
        }

        const cStaffName = (c.assigned_staff?.name || c.fullData?.staff || '').trim().toLowerCase();
        const cStaffId = c.assigned_staff_id;
        return cStaffName === nameKey || (cStaffId && cStaffId === staffInfo.id);
      });

      // Leads assigned to this staff
      const assignedLeads = leadsList.filter(l => {
        const leadStaff = (l.assignedTo || '').trim().toLowerCase();
        return leadStaff === nameKey;
      });

      const totalCases = assignedCases.length;
      let approvedCases = 0;
      let rejectedCases = 0;
      let pendingDocsCases = 0;

      assignedCases.forEach(c => {
        const st = (c.status || '').toUpperCase();
        if (st === 'APPROVED' || st === 'COMPLETED') approvedCases++;
        else if (st === 'REJECTED') rejectedCases++;
        else if (st === 'DRAFT' || st === 'PENDING_DOCS' || !c.uploadedFiles || Object.keys(c.uploadedFiles).length === 0) {
          pendingDocsCases++;
        }
      });

      const inProgressCases = Math.max(0, totalCases - approvedCases - rejectedCases);
      const completionRate = totalCases > 0 ? Math.round((approvedCases / totalCases) * 100) : 0;
      const leadsCompleted = assignedLeads.filter(l => (l.status || '').toUpperCase() === 'COMPLETED' || (l.status || '').toUpperCase() === 'CONVERTED').length;

      let perfStatus = 'Active';
      if (totalCases === 0 && assignedLeads.length === 0) perfStatus = 'No Workload';
      else if (completionRate >= 75) perfStatus = 'Top Performer';
      else if (completionRate >= 40) perfStatus = 'On Track';
      else perfStatus = 'In Progress';

      metrics.push({
        sno: idx++,
        id: staffInfo.id,
        name: staffInfo.name,
        email: staffInfo.email,
        phone: staffInfo.phone,
        totalCases,
        inProgressCases,
        approvedCases,
        rejectedCases,
        pendingDocsCases,
        leadsAssigned: assignedLeads.length,
        leadsCompleted,
        completionRate,
        status: perfStatus
      });
    });

    return metrics;
  }, [rawCases, staffList, leadsList, filterStaff, filterFromDate, filterToDate]);

  // Overall performance stats
  const performanceTotals = useMemo(() => {
    const totalAssigned = staffPerformanceData.reduce((acc, curr) => acc + curr.totalCases, 0);
    const totalApproved = staffPerformanceData.reduce((acc, curr) => acc + curr.approvedCases, 0);
    const totalInProgress = staffPerformanceData.reduce((acc, curr) => acc + curr.inProgressCases, 0);
    const totalLeads = staffPerformanceData.reduce((acc, curr) => acc + curr.leadsAssigned, 0);
    const avgRate = staffPerformanceData.length > 0
      ? Math.round(staffPerformanceData.reduce((acc, curr) => acc + curr.completionRate, 0) / staffPerformanceData.length)
      : 0;
    return { totalAssigned, totalApproved, totalInProgress, totalLeads, avgRate };
  }, [staffPerformanceData]);

  // Export CSV handler
  const handleExport = () => {
    if (filterReportType === 'Staff Performance Report') {
      if (staffPerformanceData.length === 0) {
        toast.error('No staff performance data to export');
        return;
      }

      const headers = ['S.NO', 'STAFF NAME', 'EMAIL', 'CONTACT', 'ASSIGNED CASES', 'IN PROGRESS', 'APPROVED', 'REJECTED', 'PENDING DOCS', 'LEADS ASSIGNED', 'LEADS COMPLETED', 'COMPLETION RATE (%)', 'STATUS'];
      const csvContent = [
        headers.join(','),
        ...staffPerformanceData.map(row =>
          `"${row.sno}","${row.name}","${row.email}","${row.phone}","${row.totalCases}","${row.inProgressCases}","${row.approvedCases}","${row.rejectedCases}","${row.pendingDocsCases}","${row.leadsAssigned}","${row.leadsCompleted}","${row.completionRate}%","${row.status}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Staff_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Staff Performance Excel (CSV) exported successfully');
      return;
    }

    // Default Approval Register Export
    const dataToExport = getFilteredData();
    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['S.NO', 'DATE', 'FILE NO', 'NAME', 'MOBILE NO', 'VILLAGE NAME', 'PANCHYAT', 'REFERENCE BY', 'FILE TYPE', 'FILE STATUS', 'ASSIGNED STAFF', 'USER ID & PASSWORD', 'STATUS'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        `"${row.sno}","${row.date}","${row.fileNo}","${row.name}","${row.mobile}","${row.village}","${row.panchayat}","${row.reference}","${row.fileType}","${row.fileStatus}","${row.staffName}","${row.userPass}","${row.status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Online_Approval_Register_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel (CSV) exported successfully');
  };

  // Export PDF handler
  const handleExportPDF = () => {
    if (filterReportType === 'Staff Performance Report') {
      if (staffPerformanceData.length === 0) {
        toast.error('No staff performance data to export');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Staff Performance Report - C.B. Building Approvals</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; }
                .header-box { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0b63ce; padding-bottom: 15px; }
                h1 { margin: 0; color: #0f172a; font-size: 22px; text-transform: uppercase; letter-spacing: 0.05em; }
                h3 { margin: 6px 0 0 0; color: #0b63ce; font-size: 14px; font-weight: 600; }
                .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 10px; }
                .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
                .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; background: #f8fafc; }
                .summary-card .num { font-size: 18px; font-weight: 700; color: #0b63ce; margin-top: 4px; }
                .summary-card .lbl { font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; text-align: center; font-size: 11px; margin-top: 10px; }
                th, td { border: 1px solid #94a3b8; padding: 8px 6px; }
                th { background-color: #0b63ce; color: #ffffff; font-weight: 600; text-transform: uppercase; font-size: 10px; }
                tr:nth-child(even) { background-color: #f1f5f9; }
                .rate-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
                .rate-high { background-color: #dcfce7; color: #15803d; }
                .rate-mid { background-color: #fef9c3; color: #a16207; }
                .rate-low { background-color: #fee2e2; color: #b91c1c; }
                .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
                @media print {
                  body { padding: 10px; }
                  @page { size: landscape; margin: 12mm; }
                }
              </style>
            </head>
            <body>
              <div class="header-box">
                <h1>C.B. Building Approvals ERP</h1>
                <h3>STAFF PERFORMANCE & WORKLOAD AUDIT REPORT</h3>
                <div class="meta-bar">
                  <span><strong>Period:</strong> ${filterFromDate || 'All Time'} to ${filterToDate || 'Current'}</span>
                  <span><strong>Generated On:</strong> ${new Date().toLocaleString()}</span>
                  <span><strong>Scope:</strong> ${filterStaff === 'All' ? 'All Staff Members' : filterStaff}</span>
                </div>
              </div>

              <div class="summary-grid">
                <div class="summary-card">
                  <div class="lbl">Total Active Staff</div>
                  <div class="num">${staffPerformanceData.length}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Total Assigned Cases</div>
                  <div class="num">${performanceTotals.totalAssigned}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">In Progress / Review</div>
                  <div class="num">${performanceTotals.totalInProgress}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Approved & Completed</div>
                  <div class="num" style="color: #10b981;">${performanceTotals.totalApproved}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Customer Leads Assigned</div>
                  <div class="num" style="color: #f59e0b;">${performanceTotals.totalLeads}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Avg Completion Rate</div>
                  <div class="num">${performanceTotals.avgRate}%</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>STAFF NAME</th>
                    <th>EMAIL / CONTACT</th>
                    <th>TOTAL CASES</th>
                    <th>IN PROGRESS</th>
                    <th>APPROVED</th>
                    <th>REJECTED</th>
                    <th>PENDING DOCS</th>
                    <th>LEADS</th>
                    <th>COMPLETION RATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${staffPerformanceData.map(row => `
                    <tr>
                      <td><strong>${row.sno}</strong></td>
                      <td style="text-align: left; font-weight: 600;">${row.name}</td>
                      <td style="text-align: left;">${row.email}</td>
                      <td><strong>${row.totalCases}</strong></td>
                      <td>${row.inProgressCases}</td>
                      <td style="color: #15803d; font-weight: 600;">${row.approvedCases}</td>
                      <td style="color: #b91c1c;">${row.rejectedCases}</td>
                      <td>${row.pendingDocsCases}</td>
                      <td>${row.leadsAssigned}</td>
                      <td>
                        <span class="rate-badge ${row.completionRate >= 70 ? 'rate-high' : row.completionRate >= 40 ? 'rate-mid' : 'rate-low'}">
                          ${row.completionRate}%
                        </span>
                      </td>
                      <td><strong>${row.status}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">
                <span>Confidential - For Administrative & Operational Audit Only</span>
                <span>C.B. Building Approvals System</span>
              </div>

              <script>
                window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 600); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      return;
    }

    // Default Approval Register PDF
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
            <title>Approval Register Report - C.B. Building Approvals</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; }
              th, td { border: 1px solid #000; padding: 6px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h2, h3 { text-align: center; margin: 5px 0; }
              h3 { margin-bottom: 20px; color: #555; }
              @media print {
                @page { size: landscape; margin: 10mm; }
              }
            </style>
          </head>
          <body>
            <h2>ONLINE APPROVAL REGISTER</h2>
            <h3>${currentMonthYear} - FILE DETAILS</h3>
            <table>
              <thead>
                <tr>
                  <th>S.NO</th><th>DATE</th><th>FILE NO</th><th>NAME</th><th>MOBILE NO</th><th>VILLAGE NAME</th><th>PANCHYAT</th><th>REFERENCE BY</th><th>FILE TYPE</th><th>FILE STATUS</th><th>ASSIGNED STAFF</th><th>USER ID & PASSWORD</th><th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${dataToExport.map(row => `
                  <tr>
                    <td>${row.sno}</td><td>${row.date}</td><td>${row.fileNo}</td><td>${row.name}</td><td>${row.mobile}</td><td>${row.village}</td><td>${row.panchayat}</td><td>${row.reference}</td><td>${row.fileType}</td><td>${row.fileStatus}</td><td>${row.staffName}</td><td>${row.userPass}</td><td>${row.status}</td>
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
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Report Type</label>
            <select 
              value={filterReportType} 
              onChange={(e) => {
                setFilterReportType(e.target.value);
                setIsReportVisible(false);
              }} 
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff', fontWeight: 600 }}
            >
              <option value="Approval Register">Approval Register</option>
              <option value="Staff Performance Report">Staff Performance Report</option>
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

          {filterReportType === 'Approval Register' ? (
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>File Type</label>
              <select value={filterFileType} onChange={(e) => setFilterFileType(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff' }}>
                <option value="All">All</option>
                {availableFileTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Staff Member</label>
              <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#fff' }}>
                <option value="All">All Staff Members</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <button onClick={handleView} className="btn-primary" style={{ padding: '0.625rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} /> View Report
            </button>
          </div>
        </div>
      </div>

      {isReportVisible && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>
                {filterReportType === 'Staff Performance Report' ? 'Staff Performance & Workload Report' : 'Approval Register'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {filterReportType === 'Staff Performance Report'
                  ? `Showing performance metrics across ${staffPerformanceData.length} staff member${staffPerformanceData.length !== 1 ? 's' : ''}`
                  : `${currentMonthYear} - File Approval Details`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleExport} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#10b981' }}>
                <FileDown size={16} /> Download Excel (CSV)
              </button>
              <button onClick={handleExportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#ef4444' }}>
                <FileText size={16} /> Download PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading report data...</div>
          ) : filterReportType === 'Staff Performance Report' ? (
            <div>
              {/* Summary Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(11, 99, 206, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Staff</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{staffPerformanceData.length}</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Assigned</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{performanceTotals.totalAssigned}</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>In Progress</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{performanceTotals.totalInProgress}</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Approved Cases</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{performanceTotals.totalApproved}</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Completion</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>{performanceTotals.avgRate}%</div>
                  </div>
                </div>
              </div>

              {/* Staff Performance Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0b63ce', color: '#fff' }}>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>S.NO</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>STAFF NAME</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>EMAIL / CONTACT</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>ASSIGNED CASES</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>IN PROGRESS</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>APPROVED</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>REJECTED</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>PENDING DOCS</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>LEADS</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>COMPLETION RATE</th>
                      <th style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformanceData.length > 0 ? staffPerformanceData.map(row => (
                      <tr key={row.sno} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{row.sno}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--primary-dark)' }}>{row.name}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.email}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>{row.totalCases}</td>
                        <td style={{ padding: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>{row.inProgressCases}</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>{row.approvedCases}</td>
                        <td style={{ padding: '0.75rem', color: '#ef4444' }}>{row.rejectedCases}</td>
                        <td style={{ padding: '0.75rem' }}>{row.pendingDocsCases}</td>
                        <td style={{ padding: '0.75rem' }}>{row.leadsAssigned}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            backgroundColor: row.completionRate >= 70 ? 'rgba(16, 185, 129, 0.15)' : row.completionRate >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: row.completionRate >= 70 ? '#10b981' : row.completionRate >= 40 ? '#f59e0b' : '#ef4444'
                          }}>
                            {row.completionRate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.8rem' }}>{row.status}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No staff performance records found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Approval Register Table */
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th colSpan={13} style={{ padding: '0.5rem', fontWeight: 700, color: '#000', borderBottom: '1px solid #000', border: '1px solid #000', backgroundColor: '#fff' }}>ONLINE APPROVAL REGISTER</th>
                  </tr>
                  <tr>
                    <th colSpan={13} style={{ padding: '0.5rem', fontWeight: 600, color: '#0056b3', borderBottom: '1px solid #000', border: '1px solid #000', backgroundColor: '#fff' }}>{currentMonthYear} - FILE DETAILS</th>
                  </tr>
                  <tr style={{ backgroundColor: '#fff' }}>
                    {['S.NO', 'DATE', 'FILE NO', 'NAME', 'MOBILE NO', 'VILLAGE NAME', 'PANCHYAT', 'REFERENCE BY', 'FILE TYPE', 'FILE STATUS', 'ASSIGNED STAFF', 'USER ID & PASSWORD', 'STATUS'].map((header, idx) => (
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
                      <td style={{ padding: '0.5rem', border: '1px solid #000', fontWeight: 600, color: '#0b63ce' }}>{row.staffName}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.userPass}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #000' }}>{row.status}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={13} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid #000' }}>
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
