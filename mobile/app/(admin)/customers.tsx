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
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { leadService } from '../../services/applicationService';
import { Lead } from '../../types';

const STATUS_OPTIONS = [
  { label: 'New', value: 'NEW', bg: '#DCFCE7', color: '#15803D' },
  { label: 'Application Created', value: 'APPLICATION_CREATED', bg: '#ECFDF5', color: '#059669' },
  { label: 'In Progress', value: 'IN_PROGRESS', bg: '#EFF6FF', color: '#1044C4' },
  { label: 'Completed', value: 'COMPLETED', bg: '#D1FAE5', color: '#047857' },
  { label: 'Pending', value: 'PENDING', bg: '#FEF3C7', color: '#B45309' },
  { label: 'Rejected', value: 'REJECTED', bg: '#FEE2E2', color: '#DC2626' },
];

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Status Change Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add Customer Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newService, setNewService] = useState('Building Approval');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await leadService.getAll();
      if (res.data) {
        setCustomers(res.data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
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

  // Filter logic
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.service?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Handle Status Update
  const handleOpenStatusModal = (customer: Lead) => {
    setSelectedCustomer(customer);
    setStatusModalVisible(true);
  };

  const handleUpdateStatus = async (statusValue: string) => {
    if (!selectedCustomer) return;
    setUpdatingStatus(true);
    try {
      await leadService.updateStatus(selectedCustomer.id, statusValue);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id ? { ...c, status: statusValue } : c
        )
      );
      setStatusModalVisible(false);
      setSelectedCustomer(null);
    } catch (err: any) {
      Alert.alert('Status Update', err.message || 'Failed to update customer status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Add Customer
  const handleCreateCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter customer name and phone number.');
      return;
    }

    setCreatingCustomer(true);
    try {
      const res = await leadService.create({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        service: newService.trim() || 'Building Approval',
        location: newLocation.trim() || undefined,
        notes: newNotes.trim() || undefined,
        status: 'NEW',
      });

      if (res.data) {
        setCustomers((prev) => [res.data!, ...prev]);
        setAddModalVisible(false);
        setNewName('');
        setNewPhone('');
        setNewEmail('');
        setNewLocation('');
        setNewNotes('');
        Alert.alert('Success', 'Customer lead created successfully.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Status Badge Helper
  const getStatusBadgeStyle = (statusStr?: string) => {
    const norm = (statusStr || 'NEW').toUpperCase().replace(/\s+/g, '_');
    const matched = STATUS_OPTIONS.find((s) => s.value === norm);
    if (matched) return matched;

    if (norm.includes('APPROV') || norm.includes('COMPLET')) {
      return { label: 'Completed', bg: '#D1FAE5', color: '#047857' };
    }
    if (norm.includes('CREAT')) {
      return { label: 'Application Created', bg: '#ECFDF5', color: '#059669' };
    }
    if (norm.includes('PROG')) {
      return { label: 'In Progress', bg: '#EFF6FF', color: '#1044C4' };
    }
    return { label: statusStr || 'New', bg: '#DCFCE7', color: '#15803D' };
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Customer Directory" />

      {/* ======================================================== */}
      {/* 2. SEARCH AND ADD CUSTOMER (Matched to Reference UI)     */}
      {/* ======================================================== */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, service..."
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
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add Customer"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* 3. CUSTOMER DASHBOARD SUMMARY                            */}
      {/* ======================================================== */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryTitle}>
            Total Customers: <Text style={{ color: '#1044C4' }}>{customers.length}</Text>
          </Text>
          {lastUpdated ? (
            <Text style={styles.summarySub}>Last synced today at {lastUpdated}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* 4. CUSTOMER PROFILE CARDS (Exact match to Screenshot 2)  */}
      {/* ======================================================== */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading customer directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item.id || `cust_${index}`}
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
              <Text style={styles.emptyTitle}>No Customers Found</Text>
              <Text style={styles.emptySubtitle}>
                No customers match your search query. Tap the blue (+) button above to add one.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getStatusBadgeStyle(item.status);
            const initial = item.name?.charAt(0).toUpperCase() || 'C';

            return (
              <View style={styles.card}>
                {/* Profile Top Row: Avatar + Name + Status Badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>

                  <View style={styles.headerInfo}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.service}>
                      {item.service || 'Building Approval'}
                    </Text>
                  </View>

                  {/* Interactive Status Badge: Tap to Change Status */}
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                    onPress={() => handleOpenStatusModal(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                    <Ionicons name="chevron-down" size={11} color={badge.color} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>

                {/* Contact Information Pills (Exact Match to Screenshot 2) */}
                <View style={styles.contactRow}>
                  {item.phone ? (
                    <TouchableOpacity
                      style={styles.contactPill}
                      onPress={() => Linking.openURL(`tel:${item.phone}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call-outline" size={14} color="#1044C4" />
                      <Text style={styles.contactPillText}>{item.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.email ? (
                    <TouchableOpacity
                      style={[styles.contactPill, { flex: 1 }]}
                      onPress={() => Linking.openURL(`mailto:${item.email}`)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="mail-outline" size={14} color="#64748B" />
                      <Text style={styles.contactPillText} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Location Row */}
                {item.location ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: CHANGE CUSTOMER STATUS                         */}
      {/* ======================================================== */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Customer Status</Text>
                <Text style={styles.modalSubtitle}>{selectedCustomer?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>SELECT NEW STATUS:</Text>

            <View style={styles.statusOptionsList}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedCustomer?.status?.toUpperCase() === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusOptionRow,
                      { backgroundColor: opt.bg, borderColor: isSelected ? opt.color : 'transparent' },
                    ]}
                    onPress={() => handleUpdateStatus(opt.value)}
                    disabled={updatingStatus}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                      <Text style={[styles.statusOptionLabel, { color: opt.color }]}>
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={opt.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 6. MODAL: ADD NEW CUSTOMER LEAD                          */}
      {/* ======================================================== */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter full name"
                placeholderTextColor="#94A3B8"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="customer@gmail.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />

              <Text style={styles.inputLabel}>Service Required</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Building Approval, Layout Approval"
                placeholderTextColor="#94A3B8"
                value={newService}
                onChangeText={setNewService}
              />

              <Text style={styles.inputLabel}>Location / City</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Krishnagiri, Tamil Nadu"
                placeholderTextColor="#94A3B8"
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Additional remarks..."
                placeholderTextColor="#94A3B8"
                multiline
                value={newNotes}
                onChangeText={setNewNotes}
              />

              <TouchableOpacity
                style={[styles.submitBtn, creatingCustomer && { opacity: 0.7 }]}
                onPress={handleCreateCustomer}
                disabled={creatingCustomer}
              >
                {creatingCustomer ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Customer Record</Text>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1044C4', // Primary Royal Blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1044C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Summary Bar */
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  summarySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  /* Customer Cards (Exact Match to Screenshot 2) */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1044C4', // Royal blue circle
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
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  service: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Contact Row Pills */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contactPillText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },

  /* Location Row */
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
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

  /* Modal Styles */
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#1044C4',
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statusOptionsList: {
    gap: 8,
  },
  statusOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Add Customer Form */
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
