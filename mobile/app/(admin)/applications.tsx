import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getApplicationStatus } from '../../utils/statusHelper';

type FilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function ApplicationsListScreen() {
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchCases = useCallback(async () => {
    try {
      const res = await applicationService.getAll();
      if (res.data) {
        setCases(res.data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  // Status counts for filter tabs
  const counts = useMemo(() => {
    let all = cases.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    cases.forEach((c) => {
      const st = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
      if (st.includes('APPROV') || st.includes('COMPLET')) approved++;
      else if (st.includes('REJECT')) rejected++;
      else pending++;
    });

    return { all, pending, approved, rejected };
  }, [cases]);

  // Filter & Search logic
  const filtered = useMemo(() => {
    return cases.filter((item) => {
      const q = search.toLowerCase().trim();
      const appNum = (item.application_number || item.id || '').toLowerCase();
      const name = (item.property?.owner_name || item.fullData?.customerName || '').toLowerCase();
      const phone = (item.property?.owner_phone || item.fullData?.mobile || '').toLowerCase();
      const location = (item.property?.village || item.property?.address || '').toLowerCase();
      const matchesSearch =
        !q ||
        appNum.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        location.includes(q);

      if (!matchesSearch) return false;

      if (selectedFilter === 'ALL') return true;
      const st = getApplicationStatus(item.application_number || item.id, item.status, item).toUpperCase();
      if (selectedFilter === 'APPROVED') return st.includes('APPROV') || st.includes('COMPLET');
      if (selectedFilter === 'PENDING') return !st.includes('APPROV') && !st.includes('REJECT');
      if (selectedFilter === 'REJECTED') return st.includes('REJECT');
      return true;
    });
  }, [cases, search, selectedFilter]);

  // Quick WhatsApp Upload Link handler
  const handleQuickWhatsApp = (item: Case, e: any) => {
    e.stopPropagation();
    const appNum = item.application_number || item.id;
    const uploadLink = `https://building-approval.vercel.app/upload/${appNum}`;
    const custName = item.property?.owner_name || item.fullData?.customerName || 'Customer';
    const rawPhone = item.property?.owner_phone || item.fullData?.mobile || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const msg = `Hello ${custName},\n\nPlease use the following secure link to upload your documents for building approval application ${appNum}:\n${uploadLink}\n\nCB Building Approvals`;
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(waUrl);
  };

  // Helper for status badge styling
  const getBadgeConfig = (statusStr: string) => {
    const s = statusStr.toUpperCase();
    if (s.includes('APPROV') || s.includes('COMPLET')) {
      return {
        label: 'FINALLY APPROVED',
        bg: '#DCFCE7',
        color: '#15803D',
        dot: '#16A34A',
      };
    }
    if (s.includes('REJECT')) {
      return {
        label: 'REJECTED',
        bg: '#FEE2E2',
        color: '#DC2626',
        dot: '#EF4444',
      };
    }
    if (s.includes('VERIF') || s.includes('SCRUTINY') || s.includes('REVIEW')) {
      return {
        label: 'UNDER REVIEW',
        bg: '#EFF6FF',
        color: '#1044C4',
        dot: '#2563EB',
      };
    }
    return {
      label: 'PENDING',
      bg: '#FEF3C7',
      color: '#B45309',
      dot: '#F59E0B',
    };
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Applications" />

      {/* ======================================================== */}
      {/* 2. SEARCH AND ADD APPLICATION (Matched to Reference UI)  */}
      {/* ======================================================== */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, name, or phone..."
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
          onPress={() => router.push('/(admin)/new-application')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add New Application"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* 3. APPLICATION STATUS FILTERS (Horizontally Scrollable)  */}
      {/* ======================================================== */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterType[]).map((f) => {
            const isActive = selectedFilter === f;
            const count =
              f === 'ALL'
                ? counts.all
                : f === 'PENDING'
                ? counts.pending
                : f === 'APPROVED'
                ? counts.approved
                : counts.rejected;

            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setSelectedFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {f} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ======================================================== */}
      {/* 4. APPLICATION CARDS (Matching Reference Screenshot 1)   */}
      {/* ======================================================== */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
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
              <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria or create a new application.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const appNum = item.application_number || item.id;
            const computedStatus = getApplicationStatus(appNum, item.status, item);
            const badge = getBadgeConfig(computedStatus);
            const custName = item.property?.owner_name || item.fullData?.customerName || 'Customer';
            const custPhone = item.property?.owner_phone || item.fullData?.mobile || 'No phone';
            const custLocation =
              item.property?.village ||
              item.property?.address ||
              item.fullData?.propertyDetails?.village ||
              'Tamil Nadu';
            const appType = (item.approval_type || 'BUILDING_PLAN_APPROVAL')
              .toUpperCase()
              .replace(/\s+/g, '_');
            const subDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-GB')
              : 'Recent';

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/(admin)/application-detail',
                    params: { id: appNum },
                  })
                }
              >
                {/* Top Row: App ID & Status Badge */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardAppId}>{appNum}</Text>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.statusText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Applicant Name */}
                <Text style={styles.cardOwnerName} numberOfLines={1}>
                  {custName}
                </Text>

                {/* Details Row: Phone & Location */}
                <View style={styles.cardMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="call-outline" size={13} color="#64748B" />
                    <Text style={styles.metaItemText}>{custPhone}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.metaItemText} numberOfLines={1}>
                      {custLocation}
                    </Text>
                  </View>
                </View>

                {/* Divider Line */}
                <View style={styles.cardDivider} />

                {/* Bottom Row: App Type, Date & WhatsApp Action */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.typeDateCol}>
                    <Text style={styles.appTypeText} numberOfLines={1}>
                      {appType}
                    </Text>
                    <Text style={styles.appDateText}>{subDate}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={(e) => handleQuickWhatsApp(item, e)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" />
                    <Text style={styles.whatsappBtnText}>Upload Link</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            filtered.length > 0 ? (
              <View style={styles.summaryFooter}>
                <View style={styles.summaryLeft}>
                  <Text style={styles.summaryTitle}>
                    Showing {filtered.length} of {cases.length} Applications
                  </Text>
                  {lastUpdated ? (
                    <Text style={styles.summarySub}>Last synced today at {lastUpdated}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.summaryRefreshBtn}
                  onPress={onRefresh}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White background
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
    paddingBottom: 10,
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

  /* Filters */
  filterSection: {
    paddingBottom: 12,
  },
  filterScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabActive: {
    backgroundColor: '#1044C4',
    borderColor: '#1044C4',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.2,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  /* List & Cards */
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardAppId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1044C4', // Royal blue as in Screenshot 1
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardOwnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeDateCol: {
    flex: 1,
    marginRight: 10,
  },
  appTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1044C4',
    letterSpacing: 0.2,
  },
  appDateText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22C55E', // WhatsApp Green as in Screenshot 1
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },

  /* Summary Footer */
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    marginBottom: 16,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  summarySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  summaryRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
});
