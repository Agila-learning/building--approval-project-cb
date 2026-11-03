import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Calendar, Clock, Download, Users, UserX, CalendarClock, MoreVertical, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../config/api';

const AttendanceList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [attendance, setAttendance] = useState<any[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [activeDatePreset, setActiveDatePreset] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom'>('today');

  const setPreset = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all') => {
    setActiveDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(new Date().setDate(diff)).toISOString().split('T')[0];
      setFromDate(monday);
      setToDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(todayStr);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  const loadAttendance = async () => {
    const localRecords = JSON.parse(localStorage.getItem('employeeAttendance') || '[]');
    const dateFilteredLocal = localRecords.filter((r: any) => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      return true;
    });
    setAttendance(dateFilteredLocal);

    try {
      const queryParams = new URLSearchParams();
      if (fromDate) queryParams.set('fromDate', fromDate);
      if (toDate) queryParams.set('toDate', toDate);
      if (fromDate && toDate && fromDate === toDate) {
        queryParams.set('date', fromDate);
      }

      const res = await fetch(`${getApiUrl()}/attendance?${queryParams.toString()}`);
      if (res.ok) {
        const apiRecords = await res.json();
        if (Array.isArray(apiRecords)) {
          // Merge api records with local records to ensure complete real-time view
          const merged = [...apiRecords];
          dateFilteredLocal.forEach((lr: any) => {
            if (!merged.some(m => (m.id && m.id === lr.id && m.date === lr.date) || (m.name?.toLowerCase() === lr.name?.toLowerCase() && m.date === lr.date))) {
              merged.push(lr);
            }
          });
          // Sort by date descending, then name
          merged.sort((a, b) => {
            if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
            return (a.name || '').localeCompare(b.name || '');
          });
          setAttendance(merged);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch attendance from API:', err);
    }
  };

  useEffect(() => {
    loadAttendance();
    const interval = setInterval(loadAttendance, 5000);
    window.addEventListener('storage', loadAttendance);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadAttendance);
    };
  }, [fromDate, toDate]);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportEmployee, setExportEmployee] = useState('all');

  const totalEmployees = attendance.length;
  const presentCount = attendance.filter(r => r.status === 'Present').length;
  const absentCount = attendance.filter(r => r.status === 'Absent').length;
  const leaveCount = attendance.filter(r => r.status === 'Leave').length;

  const presentPercentage = totalEmployees === 0 ? 0 : Math.round((presentCount / totalEmployees) * 100);
  const absentPercentage = totalEmployees === 0 ? 0 : Math.round((absentCount / totalEmployees) * 100);
  const leavePercentage = totalEmployees === 0 ? 0 : Math.round((leaveCount / totalEmployees) * 100);

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportDownload = () => {
    if (!exportFromDate || !exportToDate) {
      toast.success("Please select both From and To dates.");
      return;
    }

    const start = new Date(exportFromDate);
    const end = new Date(exportToDate);
    if (start > end) {
      toast.success("From Date cannot be later than To Date.");
      return;
    }

    // Generate date columns
    const dateHeaders = [];
    let curr = new Date(start);
    while (curr <= end) {
      dateHeaders.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    
    const headers = ['Employee Name', ...dateHeaders, 'Total Working Days', 'Present', 'Absent'];
    
    // Get unique employees from the attendance list
    const allEmployees = Array.from(new Set(attendance.map(a => a.name)));
    const exportTarget = exportEmployee === 'all' ? allEmployees : [exportEmployee];
      
    const rows = exportTarget.map(emp => {
      let empPresent = 0;
      let empAbsent = 0;
      const daysCount = dateHeaders.length;
      
      const rowData = dateHeaders.map(date => {
        // Find if this employee has a record for this specific date in the real data
        const recordForDate = attendance.find(a => a.name === emp && a.date === date);
        const isPresent = recordForDate && recordForDate.status === 'Present';
        
        if (isPresent) empPresent++;
        else empAbsent++;
        return isPresent ? 'Present' : 'Absent';
      });
      
      return [emp, ...rowData, daysCount, empPresent, empAbsent];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${exportFromDate}_to_${exportToDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100%', paddingBottom: '2rem' }}>
      {/* 1. PAGE HEADER WITH DATE RANGE FILTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-surface)', padding: '1.25rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>Filter Attendance by Date Range:</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* From Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>From:</span>
              <input 
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setActiveDatePreset('custom'); }}
                style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '0.8125rem' }}
              />
            </div>

            {/* To Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>To:</span>
              <input 
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setActiveDatePreset('custom'); }}
                style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '0.8125rem' }}
              />
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {(['today', 'yesterday', 'this_week', 'this_month', 'all'] as const).map(preset => {
                const labels: Record<string, string> = {
                  today: 'Today',
                  yesterday: 'Yesterday',
                  this_week: 'This Week',
                  this_month: 'This Month',
                  all: 'All Records'
                };
                const isActive = activeDatePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPreset(preset)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '1.5rem',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: isActive ? 'var(--primary)' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {labels[preset]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setShowExportModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(11, 99, 206, 0.2)' }}>
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      {/* 2. ATTENDANCE SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Card 1 */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Employees</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>{totalEmployees}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>Active Staff in Period</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, transparent 0%, #eff6ff 100%)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', right: '5%', bottom: '-30%', width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, transparent 0%, #dbeafe 100%)', zIndex: 1, opacity: 0.5 }}></div>
        </div>

        {/* Card 2 */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Present</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>{presentCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>{presentPercentage}% Attendance</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, transparent 0%, #f0fdf4 100%)', zIndex: 1 }}></div>
        </div>

        {/* Card 3 */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Absent Today</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>{absentCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>{absentPercentage}% Absent</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error-red)' }}>
              <UserX size={20} />
            </div>
          </div>
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, transparent 0%, #fef2f2 100%)', zIndex: 1 }}></div>
        </div>

        {/* Card 4 */}
        <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>On Leave</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>{leaveCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>{leavePercentage}% On Leave</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', backgroundColor: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-gold)' }}>
              <CalendarClock size={20} />
            </div>
          </div>
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, transparent 0%, #fefce8 100%)', zIndex: 1 }}></div>
        </div>

      </div>

      {/* 3. EMPLOYEE ATTENDANCE SECTION */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        
        {/* Card Header */}
        <div style={{ backgroundColor: 'var(--primary-dark)', padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 2 }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <Users size={18} color="var(--bg-surface)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--bg-surface)', margin: 0, letterSpacing: '0.025em' }}>Employee Attendance</h2>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>Today's attendance overview</div>
            </div>
          </div>
          
          <div style={{ position: 'relative', zIndex: 2, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: '0.875rem' }}>
             Building Better Tomorrow
          </div>
          
          {/* Decorative elements in header */}
          <div style={{ position: 'absolute', top: 0, right: '20%', bottom: 0, width: '200px', background: 'linear-gradient(90deg, transparent, rgba(11, 99, 206, 0.4), transparent)', transform: 'skewX(-20deg)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: 0, right: '10%', bottom: 0, width: '100px', background: 'linear-gradient(90deg, transparent, rgba(11, 99, 206, 0.2), transparent)', transform: 'skewX(-20deg)', zIndex: 1 }}></div>
        </div>

        {/* Filters */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', backgroundColor: '#f8fafc' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'var(--bg-surface)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary-dark)' }}>
            <Filter size={16} color="#64748b" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: 500, color: 'var(--primary-dark)', cursor: 'pointer', paddingRight: '0.5rem' }}
            >
              <option value="All Status">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* 4. ATTENDANCE LIST */}
        <div className="attendance-list-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', width: '60px' }}>#</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', width: '110px' }}>Date</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', width: '110px' }}>Emp ID</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Employee Details</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Check In</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Check Out</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Status</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record, index) => (
                <tr key={index} className="attendance-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: index % 2 === 0 ? '#fcfcfc' : 'var(--bg-surface)' }}>
                  
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {index + 1}
                    </div>
                  </td>

                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                    {record.date || '—'}
                  </td>
                  
                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                    {record.id}
                  </td>
                  
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={record.avatar} alt={record.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{record.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{record.role}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} color={record.checkIn !== '--' ? 'var(--primary)' : '#cbd5e1'} />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: record.checkIn !== '--' ? 'var(--primary-dark)' : '#94a3b8' }}>
                          {record.checkIn}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase' }}>
                          {record.checkIn !== '--' ? 'Checked In' : 'Not Checked In'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} color={record.checkOut !== '--' ? 'var(--primary)' : '#cbd5e1'} />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: record.checkOut !== '--' ? 'var(--primary-dark)' : '#94a3b8' }}>
                          {record.checkOut}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase' }}>
                          {record.checkOut !== '--' ? 'Checked Out' : 'Not Checked Out'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.875rem', 
                      borderRadius: '2rem', 
                      backgroundColor: record.status === 'Present' ? '#f0fdf4' : record.status === 'Absent' ? '#fef2f2' : '#fefce8', 
                      color: record.status === 'Present' ? '#166534' : record.status === 'Absent' ? '#991b1b' : '#854d0e', 
                      border: `1px solid ${record.status === 'Present' ? '#bbf7d0' : record.status === 'Absent' ? '#fecaca' : '#fef08a'}`,
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: record.status === 'Present' ? '#22c55e' : record.status === 'Absent' ? 'var(--error-red)' : 'var(--warning-gold)' }}></div>
                      {record.status}
                    </span>
                  </td>

                  <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', transition: 'all 0.2s' }} className="action-btn">
                      <MoreVertical size={18} />
                    </button>
                  </td>

                </tr>
              ))}
              
              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <UserCheck size={32} color="#94a3b8" />
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No records found</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>We couldn't find any attendance records matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '1rem', width: '90%', maxWidth: '400px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>Export Attendance Report</h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>From Date</label>
                <input 
                  type="date" 
                  value={exportFromDate} 
                  onChange={(e) => setExportFromDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>To Date</label>
                <input 
                  type="date" 
                  value={exportToDate} 
                  onChange={(e) => setExportToDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Employee</label>
                <select 
                  value={exportEmployee} 
                  onChange={(e) => setExportEmployee(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.875rem', backgroundColor: 'var(--bg-surface)' }}
                >
                  <option value="all">All Employees</option>
                  {Array.from(new Set(attendance.map(a => a.name))).map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setShowExportModal(false)}
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', border: 'none', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleExportDownload}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}
              >
                <Download size={18} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .attendance-row:hover {
          background-color: #f1f5f9 !important;
        }
        .action-btn:hover {
          background-color: #e2e8f0;
          color: var(--primary-dark) !important;
        }

        /* Mobile Responsive adjustments */
        @media (max-width: 768px) {
          .attendance-list-container table, 
          .attendance-list-container thead, 
          .attendance-list-container tbody, 
          .attendance-list-container th, 
          .attendance-list-container td, 
          .attendance-list-container tr { 
            display: block; 
          }
          
          .attendance-list-container thead tr { 
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          
          .attendance-list-container tr {
            border: 1px solid #e2e8f0 !important;
            border-radius: 0.75rem;
            margin: 1rem;
            padding: 1rem;
            position: relative;
            background-color: var(--bg-surface) !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          
          .attendance-list-container td { 
            border: none;
            padding: 0.5rem 0 !important; 
            position: relative;
          }

          /* Hide the index number column entirely on mobile, or display differently */
          .attendance-list-container td:nth-of-type(1) {
             display: none;
          }
          
          /* Emp ID */
          .attendance-list-container td:nth-of-type(2) {
             padding-bottom: 0 !important;
          }
          
          /* Action menu positioned at top right */
          .attendance-list-container td:nth-of-type(7) {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AttendanceList;
