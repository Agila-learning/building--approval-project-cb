import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { colors, spacing, borderRadius, Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { AttendanceRecord, User } from '../../types';

type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all' | 'custom';
type StatusFilter = 'ALL' | 'PRESENT' | 'HALF_DAY' | 'LEAVE';

export default function AdminAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Date States
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState<DatePreset>('today');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Data States
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mark / Update Attendance Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState('Staff Member');
  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Half Day' | 'Leave'>('Present');
  const [attendanceCheckIn, setAttendanceCheckIn] = useState('');

  // Preset Date Range Helper
  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);
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

  // Fetch Attendance Records & Staff List
  const loadData = useCallback(async () => {
    try {
      const [attendanceData, usersData] = await Promise.all([
        applicationService.getAttendance({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
        applicationService.getUsers(),
      ]);

      setRecords(attendanceData);
      const staffOnly = usersData.filter((u) => u.role === 'STAFF' || u.role !== 'ADMIN');
      setStaffUsers(staffOnly.length > 0 ? staffOnly : usersData);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter Records by search text and status
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.userName && item.userName.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.role && item.role.toLowerCase().includes(q));

      // 2. Status Filter
      const statusUpper = (item.status || '').toUpperCase();
      let matchesStatus = true;
      if (statusFilter === 'PRESENT') {
        matchesStatus = statusUpper.includes('PRESENT');
      } else if (statusFilter === 'HALF_DAY') {
        matchesStatus = statusUpper.includes('HALF');
      } else if (statusFilter === 'LEAVE') {
        matchesStatus = statusUpper.includes('LEAVE') || statusUpper.includes('ABSENT');
      }

      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Attendance Summary Metrics
  const summary = useMemo(() => {
    let present = 0;
    let halfDay = 0;
    let leave = 0;

    filteredRecords.forEach((r) => {
      const s = (r.status || '').toUpperCase();
      if (s.includes('PRESENT')) present++;
      else if (s.includes('HALF')) halfDay++;
      else if (s.includes('LEAVE') || s.includes('ABSENT')) leave++;
      else present++;
    });

    return {
      total: filteredRecords.length,
      present,
      halfDay,
      leave,
    };
  }, [filteredRecords]);

  // Open Record / Edit Modal
  const openMarkModal = (record?: AttendanceRecord) => {
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (record) {
      setSelectedStaffId(record.id || '');
      setSelectedStaffName(record.name || record.userName || 'Staff Member');
      setSelectedStaffRole(record.role || 'Staff Member');
      setAttendanceDate(record.date || todayStr);
      const s = (record.status || '').toUpperCase();
      if (s.includes('LEAVE') || s.includes('ABSENT')) setAttendanceStatus('Leave');
      else if (s.includes('HALF')) setAttendanceStatus('Half Day');
      else setAttendanceStatus('Present');
      setAttendanceCheckIn(record.checkIn || record.checkInTime || timeNow);
    } else {
      const firstStaff = staffUsers[0];
      setSelectedStaffId(firstStaff?.staffId || firstStaff?.id || 'EMP-001');
      setSelectedStaffName(firstStaff?.name || 'Staff Member');
      setSelectedStaffRole(firstStaff?.role || 'Staff Member');
      setAttendanceDate(todayStr);
      setAttendanceStatus('Present');
      setAttendanceCheckIn(timeNow);
    }
    setModalVisible(true);
  };

  // Submit Staff Attendance
  const handleSaveAttendance = async () => {
    if (!selectedStaffName) {
      Alert.alert('Required', 'Please select or enter staff name.');
      return;
    }

    setSavingAttendance(true);
    try {
      const timeStr =
        attendanceCheckIn ||
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      await applicationService.markAttendance({
        id: selectedStaffId || `EMP-${selectedStaffName.replace(/\s+/g, '')}`,
        name: selectedStaffName,
        role: selectedStaffRole || 'Staff Member',
        date: attendanceDate || todayStr,
        status: attendanceStatus,
        checkIn: attendanceStatus === 'Leave' ? '--' : timeStr,
        type: attendanceStatus === 'Leave' ? 'LEAVE' : attendanceStatus === 'Half Day' ? 'HALF_DAY' : 'PRESENT',
      });

      Alert.alert('Success', `Attendance updated for ${selectedStaffName}`);
      setModalVisible(false);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Quick initials generator
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Responsive KPI card width
  const isWide = width >= 768;
  const kpiCardWidth = isWide ? (width - 32 - 36) / 4 : (width - 32 - 12) / 2;

  // Render Single Staff Attendance Card
  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const statusUpper = (item.status || '').toUpperCase();
    const isPresent = statusUpper.includes('PRESENT');
    const isHalfDay = statusUpper.includes('HALF');
    const isLeave = statusUpper.includes('LEAVE') || statusUpper.includes('ABSENT');

    const badgeBg = isPresent ? '#DCFCE7' : isHalfDay ? '#FEF9C3' : '#FEE2E2';
    const badgeColor = isPresent ? '#15803D' : isHalfDay ? '#B45309' : '#B91C1C';
    const badgeLabel = isPresent ? 'Present' : isHalfDay ? 'Half Day' : 'Leave';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.staffMeta}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(item.name || item.userName)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.staffName} numberOfLines={1}>
                  {item.name || item.userName || 'Staff Member'}
                </Text>
                {item.id && (
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>{item.id}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.staffRole}>
                {item.role || 'Staff Member'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
            <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
            <Text style={[styles.statusText, { color: badgeColor }]}>{badgeLabel}</Text>
          </View>
        </View>

        {/* Date and Check-in Timings */}
        <View style={styles.timingRow}>
          <View style={styles.timingItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.timingLabel}>Date: </Text>
            <Text style={styles.timingValue}>{item.date}</Text>
          </View>

          <View style={styles.timingItem}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.timingLabel}>In: </Text>
            <Text style={styles.timingValue}>
              {item.checkIn || item.checkInTime || '--'}
            </Text>
          </View>

          {item.checkOut && item.checkOut !== '--' && (
            <View style={styles.timingItem}>
              <Ionicons name="log-out-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.timingLabel}>Out: </Text>
              <Text style={styles.timingValue}>{item.checkOut}</Text>
            </View>
          )}
        </View>

        {/* Action Button: Admin Update Status */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => openMarkModal(item)}
          >
            <Ionicons name="create-outline" size={14} color={Colors.primary} />
            <Text style={styles.updateBtnText}>Update Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Staff Attendance" showBack />

      {/* Main Scrollable View */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => `${item.id || item.name}_${item.date}_${index}`}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 80, 96) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Top Action Bar */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.pageTitle}>Staff Attendance Directory</Text>
                <Text style={styles.pageSubtitle}>
                  Monitor and verify field & office staff records
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => openMarkModal()}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Record</Text>
              </TouchableOpacity>
            </View>

            {/* Date Range Filter Section */}
            <View style={styles.filterCard}>
              <View style={styles.filterCardHeader}>
                <View style={styles.filterTitleRow}>
                  <Ionicons name="calendar" size={16} color={Colors.primary} />
                  <Text style={styles.filterHeading}>Date Range Filter</Text>
                </View>
                {activePreset !== 'all' && (
                  <TouchableOpacity onPress={() => applyPreset('all')}>
                    <Text style={styles.resetText}>Show All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Presets Pills */}
              <View style={styles.presetRow}>
                {(['today', 'yesterday', 'this_week', 'this_month', 'all'] as DatePreset[]).map(
                  (p) => {
                    const label =
                      p === 'today'
                        ? 'Today'
                        : p === 'yesterday'
                        ? 'Yesterday'
                        : p === 'this_week'
                        ? 'This Week'
                        : p === 'this_month'
                        ? 'This Month'
                        : 'All Dates';
                    const active = activePreset === p;

                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.presetPill, active && styles.presetPillActive]}
                        onPress={() => applyPreset(p)}
                      >
                        <Text style={[styles.presetText, active && styles.presetTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              {/* Explicit From and To Date Inputs */}
              <View style={styles.dateInputsRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>From Date</Text>
                  <View style={styles.dateInputWrap}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.dateInput}
                      value={fromDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textSecondary}
                      onChangeText={(t) => {
                        setFromDate(t);
                        setActivePreset('custom');
                      }}
                    />
                  </View>
                </View>

                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>To Date</Text>
                  <View style={styles.dateInputWrap}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.dateInput}
                      value={toDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textSecondary}
                      onChangeText={(t) => {
                        setToDate(t);
                        setActivePreset('custom');
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.filterApplyBtn}
                  onPress={loadData}
                >
                  <Ionicons name="search" size={16} color="#FFFFFF" />
                  <Text style={styles.filterApplyText}>Filter</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Attendance Summary KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { width: kpiCardWidth, borderLeftColor: Colors.primary }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="people" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.kpiNum}>{summary.total}</Text>
                <Text style={styles.kpiLabel}>Total Records</Text>
              </View>

              <View style={[styles.kpiBox, { width: kpiCardWidth, borderLeftColor: '#15803D' }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                </View>
                <Text style={[styles.kpiNum, { color: '#15803D' }]}>{summary.present}</Text>
                <Text style={styles.kpiLabel}>Present</Text>
              </View>

              <View style={[styles.kpiBox, { width: kpiCardWidth, borderLeftColor: '#B45309' }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={16} color="#B45309" />
                </View>
                <Text style={[styles.kpiNum, { color: '#B45309' }]}>{summary.halfDay}</Text>
                <Text style={styles.kpiLabel}>Half Day</Text>
              </View>

              <View style={[styles.kpiBox, { width: kpiCardWidth, borderLeftColor: '#B91C1C' }]}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="close-circle" size={16} color="#B91C1C" />
                </View>
                <Text style={[styles.kpiNum, { color: '#B91C1C' }]}>{summary.leave}</Text>
                <Text style={styles.kpiLabel}>Leave / Absent</Text>
              </View>
            </View>

            {/* Search and Status Filters */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search staff by name, role or ID..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Status Pills */}
            <View style={styles.statusPillsRow}>
              {(['ALL', 'PRESENT', 'HALF_DAY', 'LEAVE'] as StatusFilter[]).map((sf) => {
                const label =
                  sf === 'ALL'
                    ? 'All'
                    : sf === 'PRESENT'
                    ? 'Present'
                    : sf === 'HALF_DAY'
                    ? 'Half Day'
                    : 'Leave';
                const active = statusFilter === sf;

                return (
                  <TouchableOpacity
                    key={sf}
                    style={[styles.statusTab, active && styles.statusTabActive]}
                    onPress={() => setStatusFilter(sf)}
                  >
                    <Text style={[styles.statusTabText, active && styles.statusTabTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.recordsHeaderRow}>
              <Text style={styles.recordsHeading}>
                Staff Records ({filteredRecords.length})
              </Text>
              {loading && <ActivityIndicator size="small" color={Colors.primary} />}
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptySubText}>Loading staff attendance records...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Attendance Records Found</Text>
              <Text style={styles.emptySubText}>
                No staff check-ins matching {fromDate || 'start'} to {toDate || 'end'}.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => openMarkModal()}
              >
                <Text style={styles.emptyAddBtnText}>+ Record Staff Attendance</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Modal: Record / Update Staff Attendance */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Staff Attendance</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Staff Selector */}
            <Text style={styles.modalLabel}>Select Staff Member</Text>
            {staffUsers.length > 0 ? (
              <View style={styles.staffPillsWrap}>
                {staffUsers.map((u) => {
                  const isSelected =
                    selectedStaffName.toLowerCase() === (u.name || '').toLowerCase() ||
                    selectedStaffId === (u.staffId || u.id);

                  return (
                    <TouchableOpacity
                      key={u.id || u.staffId || u.name}
                      style={[styles.staffPill, isSelected && styles.staffPillActive]}
                      onPress={() => {
                        setSelectedStaffId(u.staffId || u.id || '');
                        setSelectedStaffName(u.name);
                        setSelectedStaffRole(u.role || 'Staff Member');
                      }}
                    >
                      <Text style={[styles.staffPillText, isSelected && styles.staffPillTextActive]}>
                        {u.name} {u.staffId ? `(${u.staffId})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* Name input fallback / edit */}
            <TextInput
              style={styles.modalInput}
              value={selectedStaffName}
              placeholder="Staff Name"
              placeholderTextColor={Colors.textSecondary}
              onChangeText={setSelectedStaffName}
            />

            {/* Date Input */}
            <Text style={styles.modalLabel}>Attendance Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={attendanceDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textSecondary}
              onChangeText={setAttendanceDate}
            />

            {/* Status Selector */}
            <Text style={styles.modalLabel}>Status</Text>
            <View style={styles.modalStatusRow}>
              {(['Present', 'Half Day', 'Leave'] as const).map((st) => {
                const active = attendanceStatus === st;
                const activeColor =
                  st === 'Present' ? '#15803D' : st === 'Half Day' ? '#B45309' : '#B91C1C';

                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.modalStatusBtn,
                      active && { backgroundColor: activeColor, borderColor: activeColor },
                    ]}
                    onPress={() => setAttendanceStatus(st)}
                  >
                    <Text style={[styles.modalStatusText, active && { color: '#FFFFFF' }]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Check-in Time Input */}
            {attendanceStatus !== 'Leave' && (
              <>
                <Text style={styles.modalLabel}>Check-in Time</Text>
                <TextInput
                  style={styles.modalInput}
                  value={attendanceCheckIn}
                  placeholder="e.g. 09:15 AM"
                  placeholderTextColor={Colors.textSecondary}
                  onChangeText={setAttendanceCheckIn}
                />
              </>
            )}

            {/* Modal Actions */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, savingAttendance && { opacity: 0.7 }]}
                onPress={handleSaveAttendance}
                disabled={savingAttendance}
              >
                {savingAttendance ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Attendance</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  filterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resetText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  presetPillActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'web' ? 8 : 4,
  },
  dateInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
    padding: 0,
  },
  filterApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  filterApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  kpiBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    elevation: 2,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiNum: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 6,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  statusTabActive: {
    backgroundColor: Colors.primary,
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  recordsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  staffMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  staffRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  updateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  emptyAddBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  staffPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  staffPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  staffPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  staffPillTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  modalStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalStatusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
