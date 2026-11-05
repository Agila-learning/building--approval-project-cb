import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { applicationService, leadService } from '../../services/applicationService';
import { Case, User, Lead } from '../../types';
import { getApplicationStatus } from '../../utils/statusHelper';

type ReportType = 'STAFF_PERF' | 'APPROVAL_REG' | 'FINANCIAL';
type DatePreset = 'this_month' | 'today' | 'this_week' | 'all';

interface StaffMetricRow {
  id: string;
  sno: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  totalCases: number;
  inProgressCases: number;
  approvedCases: number;
  rejectedCases: number;
  pendingDocsCases: number;
  leadsAssigned: number;
  completionRate: number;
  status: string;
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Report Type
  const [reportType, setReportType] = useState<ReportType>('STAFF_PERF');

  // Filters
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [activeDatePreset, setActiveDatePreset] = useState<DatePreset>('all');

  // Data States
  const [cases, setCases] = useState<Case[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [casesRes, usersData, leadsRes] = await Promise.all([
        applicationService.getAll(),
        applicationService.getUsers(),
        leadService.getAll(),
      ]);

      if (casesRes.data) setCases(casesRes.data);
      setStaffUsers(usersData);
      if (leadsRes.data) setLeads(leadsRes.data);
    } catch (e) {
      console.error('Failed to load reports data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Date Preset Helper
  const applyPreset = (preset: DatePreset) => {
    setActiveDatePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
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
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  // Date filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Date filter
      if (c.created_at) {
        const caseDate = c.created_at.split('T')[0];
        if (fromDate && caseDate < fromDate) return false;
        if (toDate && caseDate > toDate) return false;
      }

      // Staff filter
      if (selectedStaffFilter !== 'ALL') {
        const staffName = (c.assigned_staff?.name || c.fullData?.staff || c.assignedTo || '').toLowerCase();
        if (!staffName.includes(selectedStaffFilter.toLowerCase())) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        const st = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
        if (selectedStatusFilter === 'APPROVED' && !st.includes('APPROV') && !st.includes('COMPLET')) return false;
        if (selectedStatusFilter === 'PENDING' && (st.includes('APPROV') || st.includes('REJECT'))) return false;
        if (selectedStatusFilter === 'REJECTED' && !st.includes('REJECT')) return false;
      }

      return true;
    });
  }, [cases, fromDate, toDate, selectedStaffFilter, selectedStatusFilter]);

  // Overall Counts
  const overallMetrics = useMemo(() => {
    const total = filteredCases.length;
    let approved = 0;
    let inProgress = 0;
    let rejected = 0;
    let totalPaid = 0;
    let totalPending = 0;

    filteredCases.forEach((c: any) => {
      const st = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
      if (st.includes('APPROV') || st.includes('COMPLET')) approved++;
      else if (st.includes('REJECT')) rejected++;
      else inProgress++;

      const feeTot = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
      const feePaid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
      const feePend = c.fees?.pending !== undefined && c.fees?.pending !== null ? Number(c.fees.pending) : Math.max(0, feeTot - feePaid);

      totalPaid += feePaid;
      totalPending += feePend;
    });

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      approved,
      inProgress,
      rejected,
      totalPaid,
      totalPending,
      approvalRate,
    };
  }, [filteredCases]);

  // Staff-Wise Performance Breakdown Table Data
  const staffPerformanceData = useMemo<StaffMetricRow[]>(() => {
    const activeStaff = staffUsers.filter((u) => u.role === 'STAFF' || u.role !== 'CLIENT_READONLY');

    return activeStaff.map((staff, idx) => {
      const staffName = (staff.name || '').toLowerCase().trim();
      const staffId = staff.staffId || staff.id || '';

      // Assigned cases for this staff in filtered set
      const assignedCases = filteredCases.filter((c: any) => {
        const cStaffName = (c.assigned_staff?.name || c.fullData?.staff || c.assignedTo || '').toLowerCase().trim();
        const cStaffId = c.assigned_staff_id || c.assigned_staff?.id || '';
        return (staffName && (cStaffName === staffName || cStaffName.includes(staffName))) || (staffId && cStaffId === staffId);
      });

      let appApproved = 0;
      let appInProgress = 0;
      let appRejected = 0;
      let appPendingDocs = 0;

      assignedCases.forEach((c) => {
        const st = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
        if (st.includes('APPROV') || st.includes('COMPLET')) appApproved++;
        else if (st.includes('REJECT')) appRejected++;
        else if (st.includes('DOCUMENTS_PENDING') || st.includes('INTAKE')) appPendingDocs++;
        else appInProgress++;
      });

      // Assigned leads
      const assignedLeads = leads.filter((l: any) => {
        const lAssigned = (l.assignedTo || '').toLowerCase();
        return staffName && lAssigned.includes(staffName);
      }).length;

      const completionRate = assignedCases.length > 0 ? Math.round((appApproved / assignedCases.length) * 100) : 0;

      return {
        id: staff.id || staff.staffId || `staff_${idx}`,
        sno: idx + 1,
        name: staff.name,
        email: staff.email || 'N/A',
        phone: staff.phone || 'N/A',
        role: staff.role || 'Staff Member',
        totalCases: assignedCases.length,
        inProgressCases: appInProgress,
        approvedCases: appApproved,
        rejectedCases: appRejected,
        pendingDocsCases: appPendingDocs,
        leadsAssigned: assignedLeads,
        completionRate,
        status: staff.status || 'Active',
      };
    });
  }, [staffUsers, filteredCases, leads]);

  // Export / Download PDF Handler
  const handleExportPDF = () => {
    if (staffPerformanceData.length === 0) {
      Alert.alert('Notice', 'No staff performance records to export.');
      return;
    }

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Staff Performance Report - C.B. Building Approvals</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #1e293b; background: #fff; }
                .header-box { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #022F94; padding-bottom: 15px; }
                h1 { margin: 0; color: #022F94; font-size: 24px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; }
                h3 { margin: 6px 0 0 0; color: #D6A756; font-size: 15px; font-weight: 700; text-transform: uppercase; }
                .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
                .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
                .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
                .summary-card .num { font-size: 20px; font-weight: 800; color: #022F94; margin-top: 4px; }
                .summary-card .lbl { font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 700; }
                table { width: 100%; border-collapse: collapse; text-align: center; font-size: 11px; margin-top: 14px; }
                th, td { border: 1px solid #cbd5e1; padding: 10px 8px; }
                th { background-color: #022F94; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 10px; }
                tr:nth-child(even) { background-color: #f8fafc; }
                .rate-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-weight: 800; font-size: 11px; }
                .rate-high { background-color: #dcfce7; color: #15803d; }
                .rate-mid { background-color: #fef9c3; color: #a16207; }
                .rate-low { background-color: #fee2e2; color: #b91c1c; }
                .footer { margin-top: 35px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
                @media print {
                  body { padding: 10px; }
                  @page { size: landscape; margin: 10mm; }
                }
              </style>
            </head>
            <body>
              <div class="header-box">
                <h1>C.B. BUILDING APPROVALS</h1>
                <h3>STAFF PERFORMANCE & APPLICATION AUDIT REPORT</h3>
                <div class="meta-bar">
                  <span><strong>Filter Period:</strong> ${fromDate || 'All Time'} to ${toDate || 'Present'}</span>
                  <span><strong>Generated On:</strong> ${new Date().toLocaleString()}</span>
                  <span><strong>Staff Scope:</strong> ${selectedStaffFilter === 'ALL' ? 'All Staff Members' : selectedStaffFilter}</span>
                </div>
              </div>

              <div class="summary-grid">
                <div class="summary-card">
                  <div class="lbl">Total Active Staff</div>
                  <div class="num">${staffPerformanceData.length}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Total Cases</div>
                  <div class="num">${overallMetrics.total}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">In Progress / Pending</div>
                  <div class="num" style="color: #b45309;">${overallMetrics.inProgress}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Approved Finally</div>
                  <div class="num" style="color: #15803d;">${overallMetrics.approved}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Rejected Cases</div>
                  <div class="num" style="color: #dc2626;">${overallMetrics.rejected}</div>
                </div>
                <div class="summary-card">
                  <div class="lbl">Overall Approval Rate</div>
                  <div class="num" style="color: #022F94;">${overallMetrics.approvalRate}%</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>STAFF NAME</th>
                    <th>CONTACT / PHONE</th>
                    <th>TOTAL CASES</th>
                    <th>IN PROGRESS</th>
                    <th>APPROVED FINALLY</th>
                    <th>REJECTED</th>
                    <th>DOCS PENDING</th>
                    <th>LEADS</th>
                    <th>COMPLETION %</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${staffPerformanceData.map((row) => `
                    <tr>
                      <td><strong>${row.sno}</strong></td>
                      <td style="text-align: left; font-weight: 700; color: #022F94;">${row.name}</td>
                      <td style="text-align: left;">${row.phone}</td>
                      <td><strong>${row.totalCases}</strong></td>
                      <td style="color: #b45309; font-weight: 600;">${row.inProgressCases}</td>
                      <td style="color: #15803d; font-weight: 700;">${row.approvedCases}</td>
                      <td style="color: #dc2626; font-weight: 600;">${row.rejectedCases}</td>
                      <td>${row.pendingDocsCases}</td>
                      <td>${row.leadsAssigned}</td>
                      <td>
                        <span class="rate-badge ${
                          row.completionRate >= 70
                            ? 'rate-high'
                            : row.completionRate >= 40
                            ? 'rate-mid'
                            : 'rate-low'
                        }">
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
                <span>C.B. Building Approvals ERP System</span>
              </div>

              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      Alert.alert(
        'PDF Export',
        'Staff Performance audit report generated. Open in web browser to print or save as PDF.'
      );
    }
  };

  // Responsive KPI Width
  const isWide = width >= 768;
  const kpiWidth = isWide ? (width - 32 - 36) / 4 : (width - 32 - 12) / 2;

  return (
    <View style={styles.container}>
      <MobileHeader title="Analytics & Reports" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 96) },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Top Report Type Tabs (Horizontal Scrollable Pills - Never Clashes/Overlaps) */}
        <View style={styles.reportTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reportTabsScrollContent}
          >
            <TouchableOpacity
              style={[styles.repTab, reportType === 'STAFF_PERF' && styles.repTabActive]}
              onPress={() => setReportType('STAFF_PERF')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="people"
                size={16}
                color={reportType === 'STAFF_PERF' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.repTabText, reportType === 'STAFF_PERF' && styles.repTabTextActive]}>
                Staff Performance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.repTab, reportType === 'APPROVAL_REG' && styles.repTabActive]}
              onPress={() => setReportType('APPROVAL_REG')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-text"
                size={16}
                color={reportType === 'APPROVAL_REG' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.repTabText, reportType === 'APPROVAL_REG' && styles.repTabTextActive]}>
                Approval Register
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.repTab, reportType === 'FINANCIAL' && styles.repTabActive]}
              onPress={() => setReportType('FINANCIAL')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="cash"
                size={16}
                color={reportType === 'FINANCIAL' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.repTabText, reportType === 'FINANCIAL' && styles.repTabTextActive]}>
                Fees & Revenue
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Attractive High-Converting KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Cases */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: Colors.primary }]}>
            <View style={styles.kpiCardTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="folder" size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.kpiTag, { color: Colors.primary, backgroundColor: '#EFF6FF' }]}>
                Cases
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: Colors.primary }]}>
              {overallMetrics.total}
            </Text>
            <Text style={styles.kpiLabel}>Total Applications</Text>
          </View>

          {/* Card 2: Finally Approved */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: '#15803D' }]}>
            <View style={styles.kpiCardTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-done" size={18} color="#15803D" />
              </View>
              <Text style={[styles.kpiTag, { color: '#15803D', backgroundColor: '#DCFCE7' }]}>
                Approved
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: '#15803D' }]}>
              {overallMetrics.approved}
            </Text>
            <Text style={styles.kpiLabel}>Finally Approved</Text>
          </View>

          {/* Card 3: In Progress / Pending */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: '#B45309' }]}>
            <View style={styles.kpiCardTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="hourglass" size={18} color="#B45309" />
              </View>
              <Text style={[styles.kpiTag, { color: '#B45309', backgroundColor: '#FEF3C7' }]}>
                Active
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: '#B45309' }]}>
              {overallMetrics.inProgress}
            </Text>
            <Text style={styles.kpiLabel}>In Progress / Pending</Text>
          </View>

          {/* Card 4: Approval Rate % */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: '#7E22CE' }]}>
            <View style={styles.kpiCardTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="trending-up" size={18} color="#7E22CE" />
              </View>
              <Text style={[styles.kpiTag, { color: '#7E22CE', backgroundColor: '#F3E8FF' }]}>
                Efficiency
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: '#7E22CE' }]}>
              {overallMetrics.approvalRate}%
            </Text>
            <Text style={styles.kpiLabel}>Clearance Rate</Text>
          </View>
        </View>

        {/* Filter Controls Card */}
        <View style={styles.filterCard}>
          <View style={styles.filterCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="options-outline" size={16} color={Colors.primary} />
              <Text style={styles.filterCardTitle}>Report Audit Filters</Text>
            </View>

            {/* Download PDF Button */}
            <TouchableOpacity style={styles.downloadPdfBtn} onPress={handleExportPDF}>
              <Ionicons name="download-outline" size={15} color="#FFFFFF" />
              <Text style={styles.downloadPdfBtnText}>Download PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Date Presets */}
          <View style={styles.datePresetRow}>
            {(['all', 'this_month', 'this_week', 'today'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.presetBtn, activeDatePreset === p && styles.presetBtnActive]}
                onPress={() => applyPreset(p)}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    activeDatePreset === p && styles.presetBtnTextActive,
                  ]}
                >
                  {p === 'all'
                    ? 'All Time'
                    : p === 'this_month'
                    ? 'This Month'
                    : p === 'this_week'
                    ? 'This Week'
                    : 'Today'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* From and To Date Inputs */}
          <View style={styles.dateInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputMiniLabel}>From Date</Text>
              <TextInput
                style={styles.miniDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                value={fromDate}
                onChangeText={(t) => {
                  setFromDate(t);
                  setActiveDatePreset('all');
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputMiniLabel}>To Date</Text>
              <TextInput
                style={styles.miniDateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                value={toDate}
                onChangeText={(t) => {
                  setToDate(t);
                  setActiveDatePreset('all');
                }}
              />
            </View>
          </View>

          {/* Status Filter Pills */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusFilterPill,
                  selectedStatusFilter === st && styles.statusFilterPillActive,
                ]}
                onPress={() => setSelectedStatusFilter(st)}
              >
                <Text
                  style={[
                    styles.statusFilterPillText,
                    selectedStatusFilter === st && styles.statusFilterPillTextActive,
                  ]}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ================= REPORT TYPE 1: STAFF PERFORMANCE AUDIT ================= */}
        {reportType === 'STAFF_PERF' && (
          <View>
            <View style={styles.sectionHeaderBlock}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="people" size={18} color={Colors.primaryDark} />
                <Text style={styles.sectionHeading}>
                  Staff-Wise Performance & Audit ({staffPerformanceData.length})
                </Text>
              </View>
              <View style={styles.liveMetricsPill}>
                <View style={styles.liveMetricsPulseDot} />
                <Text style={styles.liveMetricsPillText}>Live metrics per employee</Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : staffPerformanceData.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Staff Performance Records</Text>
              </View>
            ) : (
              staffPerformanceData.map((staff) => (
                <View key={staff.id} style={styles.staffMetricCard}>
                  {/* Top Bar: Name, Role, Completion Badge */}
                  <View style={styles.staffCardTop}>
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>
                        {staff.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={styles.staffSubText}>
                        {staff.role} • {staff.phone}
                      </Text>
                    </View>

                    {/* Completion Rate Badge */}
                    <View
                      style={[
                        styles.rateBadge,
                        staff.completionRate >= 70
                          ? styles.rateHigh
                          : staff.completionRate >= 40
                          ? styles.rateMid
                          : styles.rateLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rateBadgeText,
                          staff.completionRate >= 70
                            ? styles.rateTextHigh
                            : staff.completionRate >= 40
                            ? styles.rateTextMid
                            : styles.rateTextLow,
                        ]}
                      >
                        {staff.completionRate}% Done
                      </Text>
                    </View>
                  </View>

                  {/* 4-Col Breakdown Grid */}
                  <View style={styles.breakdownGrid}>
                    <View style={styles.breakdownCol}>
                      <Text style={styles.breakdownNum}>{staff.totalCases}</Text>
                      <Text style={styles.breakdownLbl}>Total Assigned</Text>
                    </View>

                    <View style={styles.breakdownCol}>
                      <Text style={[styles.breakdownNum, { color: '#15803D' }]}>
                        {staff.approvedCases}
                      </Text>
                      <Text style={styles.breakdownLbl}>Approved</Text>
                    </View>

                    <View style={styles.breakdownCol}>
                      <Text style={[styles.breakdownNum, { color: '#B45309' }]}>
                        {staff.inProgressCases}
                      </Text>
                      <Text style={styles.breakdownLbl}>In Progress</Text>
                    </View>

                    <View style={styles.breakdownCol}>
                      <Text style={[styles.breakdownNum, { color: '#DC2626' }]}>
                        {staff.rejectedCases}
                      </Text>
                      <Text style={styles.breakdownLbl}>Rejected</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarWrap}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, staff.completionRate)}%`,
                            backgroundColor:
                              staff.completionRate >= 70
                                ? '#15803D'
                                : staff.completionRate >= 40
                                ? '#B45309'
                                : '#DC2626',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressPercent}>{staff.completionRate}% clearance</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= REPORT TYPE 2: APPROVAL REGISTER ================= */}
        {reportType === 'APPROVAL_REG' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                Online Approval Register ({filteredCases.length})
              </Text>
            </View>

            {filteredCases.map((c) => {
              const st = getApplicationStatus(c.application_number || c.id, c.status, c);
              const isApproved = st.toUpperCase().includes('APPROV');

              return (
                <View key={c.id} style={styles.appCard}>
                  <View style={styles.appCardTop}>
                    <Text style={styles.appId}>{c.application_number || c.id}</Text>
                    <View
                      style={[
                        styles.statusMiniBadge,
                        {
                          backgroundColor: isApproved ? '#DCFCE7' : '#EFF6FF',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusMiniText,
                          { color: isApproved ? '#15803D' : Colors.primary },
                        ]}
                      >
                        {st}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.appOwner}>
                    {c.property?.owner_name || c.fullData?.customerName || 'Customer'}
                  </Text>
                  <Text style={styles.appMeta}>
                    {c.approval_type || 'Building Plan Approval'} •{' '}
                    {c.property?.village || c.property?.address || 'Tamil Nadu'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ================= REPORT TYPE 3: FINANCIAL OVERVIEW ================= */}
        {reportType === 'FINANCIAL' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Revenue & Balance Audit</Text>
            </View>

            <View style={styles.finGrid}>
              <View style={[styles.finBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <Ionicons name="cash-outline" size={24} color="#15803D" />
                <Text style={styles.finBoxLabel}>Total Collected Fees</Text>
                <Text style={[styles.finBoxNum, { color: '#15803D' }]}>
                  ₹{overallMetrics.totalPaid.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={[styles.finBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Ionicons name="time-outline" size={24} color="#DC2626" />
                <Text style={styles.finBoxLabel}>Outstanding Balances</Text>
                <Text style={[styles.finBoxNum, { color: '#DC2626' }]}>
                  ₹{overallMetrics.totalPending.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  reportTabsWrapper: {
    marginBottom: 16,
  },
  reportTabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  repTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  repTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  repTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  repTabTextActive: {
    color: '#FFFFFF',
  },

  /* Attractive KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTag: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kpiNum: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Filter Card */
  filterCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: 16,
  },
  filterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  datePresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  presetBtnActive: {
    backgroundColor: Colors.primary,
  },
  presetBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  miniDateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'web' ? 7 : 4,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  statusFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  statusFilterPillActive: {
    backgroundColor: Colors.primary,
  },
  statusFilterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusFilterPillTextActive: {
    color: '#FFFFFF',
  },

  /* Staff Performance Cards */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeaderBlock: {
    marginTop: 10,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#022F94',
  },
  liveMetricsPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  liveMetricsPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1044C4',
  },
  liveMetricsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1044C4', // Styled Royal Blue with distinct color and clean alignment!
  },
  staffMetricCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    elevation: 2,
  },
  staffCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  staffAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  staffSubText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateHigh: {
    backgroundColor: '#DCFCE7',
  },
  rateMid: {
    backgroundColor: '#FEF9C3',
  },
  rateLow: {
    backgroundColor: '#FEE2E2',
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rateTextHigh: {
    color: '#15803D',
  },
  rateTextMid: {
    color: '#B45309',
  },
  rateTextLow: {
    color: '#DC2626',
  },
  breakdownGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownNum: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  breakdownLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  /* Approval Register */
  appCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  appCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appId: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusMiniText: {
    fontSize: 10,
    fontWeight: '700',
  },
  appOwner: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  appMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Financial Box */
  finGrid: {
    gap: 10,
  },
  finBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  finBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 6,
  },
  finBoxNum: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
});
