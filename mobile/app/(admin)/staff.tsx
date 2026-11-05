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
  Linking,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MobileHeader } from '../../components/MobileHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { User, Case } from '../../types';
import { getApplicationStatus } from '../../utils/statusHelper';

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Staff for Filtered Workload View Drawer
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Add staff modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [usersData, casesRes] = await Promise.all([
        applicationService.getUsers(),
        applicationService.getAll(),
      ]);
      setStaffList(usersData);
      if (casesRes.data) setCases(casesRes.data);
    } catch (e) {
      console.error('Failed to load staff screen data:', e);
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

  const handleCreateStaff = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please fill name, username and password');
      return;
    }

    setSubmitting(true);
    try {
      await applicationService.createUser({
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role,
        phone: phone.trim(),
        email: email.trim(),
      });
      Alert.alert('Success', 'Staff member created successfully');
      setAddModalVisible(false);
      setName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setEmail('');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter staff list by search
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        (s.role && s.role.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.staffId && s.staffId.toLowerCase().includes(q))
      );
    });
  }, [staffList, search]);

  // Compute cases assigned to a specific staff member
  const getStaffCases = useCallback(
    (staff: User | null): Case[] => {
      if (!staff) return [];
      const staffName = (staff.name || '').toLowerCase().trim();
      const staffId = staff.staffId || staff.id || staff._id || '';

      return cases.filter((c: any) => {
        const assignedName = (c.assigned_staff?.name || c.fullData?.staff || c.assignedTo || '')
          .toLowerCase()
          .trim();
        const assignedId = c.assigned_staff_id || c.assigned_staff?.id || '';

        const nameMatch = staffName && (assignedName === staffName || assignedName.includes(staffName));
        const idMatch = staffId && assignedId === staffId;

        return nameMatch || idMatch;
      });
    },
    [cases]
  );

  // Selected staff workload metrics
  const staffCases = useMemo(() => getStaffCases(selectedStaff), [getStaffCases, selectedStaff]);

  const staffMetrics = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    staffCases.forEach((c) => {
      const st = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
      if (st.includes('APPROV') || st.includes('COMPLET')) approved++;
      else if (st.includes('REJECT')) rejected++;
      else pending++;
    });

    const total = staffCases.length;
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, pending, rejected, rate };
  }, [staffCases]);

  const openStaffWorkload = (staff: User) => {
    setSelectedStaff(staff);
    setDetailModalOpen(true);
  };

  const renderStaffCard = ({ item }: { item: User }) => {
    const assignedCount = getStaffCases(item).length;
    const isMasterAdmin = item.role === 'ADMIN';
    const isManager = (item.role as string) === 'MANAGER';
    const roleColor = isMasterAdmin ? '#B45309' : isManager ? '#7E22CE' : '#1044C4';
    const roleBg = isMasterAdmin ? '#FEF3C7' : isManager ? '#F3E8FF' : '#EFF6FF';
    const initial = item.name?.charAt(0).toUpperCase() || 'S';

    return (
      <View style={styles.card}>
        {/* Profile Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {item.staffId ? (
                <View style={styles.staffIdBadge}>
                  <Text style={styles.staffIdBadgeText}>{item.staffId}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.username}>@{item.username || 'staff'}</Text>
          </View>

          <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
            <Text style={[styles.roleBadgeText, { color: roleColor }]}>
              {item.role || 'STAFF'}
            </Text>
          </View>
        </View>

        {/* Assigned Cases Section (Clickable) */}
        <TouchableOpacity
          style={styles.workloadBox}
          onPress={() => openStaffWorkload(item)}
          activeOpacity={0.7}
        >
          <View style={styles.workloadLeft}>
            <View style={styles.folderIconWrap}>
              <Ionicons name="folder-open" size={16} color="#1044C4" />
            </View>
            <Text style={styles.workloadText}>
              <Text style={styles.workloadNum}>{assignedCount}</Text> Assigned Cases
            </Text>
          </View>

          <View style={styles.viewDataBtn}>
            <Text style={styles.viewDataBtnText}>View Data →</Text>
          </View>
        </TouchableOpacity>

        {/* Contact Information */}
        <View style={styles.contactRow}>
          {item.phone ? (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={13} color="#1044C4" />
              <Text style={styles.contactItemText}>{item.phone}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={13} color="#94A3B8" />
              <Text style={[styles.contactItemText, { color: '#94A3B8' }]}>
                No phone number available
              </Text>
            </View>
          )}

          {item.email ? (
            <TouchableOpacity
              style={[styles.contactItem, { flex: 1 }]}
              onPress={() => Linking.openURL(`mailto:${item.email}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={13} color="#64748B" />
              <Text style={styles.contactItemText} numberOfLines={1}>
                {item.email}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header: Back button uses only the icon inside circular button */}
      <MobileHeader title="Staff Management" showBack />

      {/* ======================================================== */}
      {/* 2. SEARCH AND ADD STAFF                                  */}
      {/* ======================================================== */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name, ID or phone..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={15} color="#FFFFFF" />
          <Text style={styles.addBtnText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* 3. STAFF DIRECTORY HEADING                               */}
      {/* ======================================================== */}
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionHeading}>
          Staff Directory ({filteredStaff.length})
        </Text>
        <Text style={styles.hintText}>Tap any staff member to view details</Text>
      </View>

      {/* ======================================================== */}
      {/* 4. STAFF PROFILE CARDS LIST                              */}
      {/* ======================================================== */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading staff records & workloads...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id || item.username || item.name}
          renderItem={renderStaffCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 84, 96) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Staff Members Found</Text>
              <Text style={styles.emptySubtitle}>
                No records match your search criteria. Tap + Add Staff to create one.
              </Text>
            </View>
          }
        />
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: FILTERED STAFF WORKLOAD DRAWER                 */}
      {/* ======================================================== */}
      <Modal
        visible={detailModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
          <MobileHeader
            title={selectedStaff?.name || 'Staff Member'}
            showBack
            onBack={() => setDetailModalOpen(false)}
          />

          <ScrollView
            contentContainerStyle={[
              styles.drawerScroll,
              { paddingBottom: Math.max(insets.bottom + 40, 60) },
            ]}
          >
            {/* Staff Profile Overview Card */}
            <View style={styles.profileOverviewCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {selectedStaff?.name?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{selectedStaff?.name}</Text>
                <Text style={styles.profileRole}>
                  {selectedStaff?.role === 'ADMIN' ? 'Administrator' : 'Staff Member'} • @{selectedStaff?.username}
                </Text>
                {selectedStaff?.phone ? (
                  <Text style={styles.profileMeta}>{selectedStaff.phone}</Text>
                ) : null}
              </View>
            </View>

            {/* Workload 2x2 Performance Grid */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricTile, { borderLeftColor: '#1044C4' }]}>
                <Text style={styles.metricVal}>{staffMetrics.total}</Text>
                <Text style={styles.metricLbl}>Total Assigned</Text>
              </View>
              <View style={[styles.metricTile, { borderLeftColor: '#15803D' }]}>
                <Text style={[styles.metricVal, { color: '#15803D' }]}>{staffMetrics.approved}</Text>
                <Text style={styles.metricLbl}>Approved Cases</Text>
              </View>
              <View style={[styles.metricTile, { borderLeftColor: '#B45309' }]}>
                <Text style={[styles.metricVal, { color: '#B45309' }]}>{staffMetrics.pending}</Text>
                <Text style={styles.metricLbl}>In Progress</Text>
              </View>
              <View style={[styles.metricTile, { borderLeftColor: '#7E22CE' }]}>
                <Text style={[styles.metricVal, { color: '#7E22CE' }]}>{staffMetrics.rate}%</Text>
                <Text style={styles.metricLbl}>Clearance Rate</Text>
              </View>
            </View>

            {/* Filtered Assigned Applications Heading */}
            <View style={styles.drawerSectionHeader}>
              <Ionicons name="document-text" size={18} color="#1044C4" />
              <Text style={styles.drawerSectionTitle}>
                Assigned Applications ({staffCases.length})
              </Text>
            </View>

            {staffCases.length === 0 ? (
              <View style={styles.drawerEmpty}>
                <Ionicons name="folder-open-outline" size={40} color="#94A3B8" />
                <Text style={styles.drawerEmptyTitle}>No Cases Assigned Yet</Text>
                <Text style={styles.drawerEmptySub}>
                  This staff member currently has 0 active building approval cases assigned.
                </Text>
              </View>
            ) : (
              staffCases.map((item) => {
                const appNum = item.application_number || item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.assignedAppCard}
                    activeOpacity={0.7}
                    onPress={() => {
                      setDetailModalOpen(false);
                      router.push({
                        pathname: '/(admin)/application-detail',
                        params: { id: appNum },
                      });
                    }}
                  >
                    <View style={styles.assignedTop}>
                      <Text style={styles.assignedAppNum}>{appNum}</Text>
                      <StatusBadge status={item.status} caseData={item} id={appNum} />
                    </View>
                    <Text style={styles.assignedOwner}>
                      {item.property?.owner_name || item.fullData?.customerName || 'Customer'}
                    </Text>
                    <Text style={styles.assignedMeta}>
                      {item.approval_type || 'Building Plan Approval'} •{' '}
                      {item.property?.village || 'Tamil Nadu'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 6. MODAL: ADD NEW STAFF MEMBER                           */}
      {/* ======================================================== */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. ramesh.cb"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter login password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.rolePickerRow}>
                {(['STAFF', 'ADMIN'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleOption, role === r && styles.roleOptionActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextActive]}>
                      {r === 'ADMIN' ? 'Administrator' : 'Staff Member'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Mobile Phone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="10-digit mobile"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="staff@buildingapproval.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleCreateStaff}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Staff Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Search & Add */
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1044C4',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#1044C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Heading */
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Staff Cards */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1044C4',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1044C4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  staffIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  staffIdBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  username: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  /* Workload Box */
  workloadBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  workloadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workloadText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  workloadNum: {
    color: '#1044C4',
    fontWeight: '800',
  },
  viewDataBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewDataBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1044C4',
  },

  /* Contact Row */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactItemText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },

  /* Empty state */
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },

  /* Workload Drawer */
  drawerScroll: {
    padding: 16,
  },
  profileOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 14,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1044C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileRole: {
    fontSize: 12,
    color: '#1044C4',
    fontWeight: '600',
    marginTop: 2,
  },
  profileMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  metricTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  drawerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  drawerSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  drawerEmpty: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  drawerEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  drawerEmptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  assignedAppCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignedAppNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1044C4',
  },
  assignedOwner: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignedMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  /* Add Staff Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleOptionActive: {
    backgroundColor: '#1044C4',
    borderColor: '#1044C4',
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#1044C4',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
