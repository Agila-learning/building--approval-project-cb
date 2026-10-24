import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';

interface PaymentItem {
  id: string;
  mongoId: string;
  customer: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Pending' | 'Partial' | 'Paid';
  date: string;
  mobile: string;
  originalCase: Case;
}

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL_PENDING' | 'PENDING' | 'PARTIAL' | 'PAID' | 'ALL'>('ALL_PENDING');

  const loadData = useCallback(async () => {
    try {
      const res = await applicationService.getAll();
      const casesData: Case[] = res.data || [];

      const mapped: PaymentItem[] = casesData.map((c: any) => {
        const total = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
        const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
        const pending = c.fees?.pending !== undefined && c.fees?.pending !== null 
          ? Number(c.fees.pending) 
          : Math.max(0, total - paid);

        let finalStatus: 'Pending' | 'Partial' | 'Paid' = 'Pending';
        if (pending === 0 && total > 0) {
          finalStatus = 'Paid';
        } else if (paid > 0 && pending > 0) {
          finalStatus = 'Partial';
        } else {
          finalStatus = 'Pending';
        }

        return {
          id: c.application_number || c.id,
          mongoId: c.id,
          customer: c.property?.owner_name || c.fullData?.customerName || c.clientName || 'Customer',
          type: c.approval_type || 'Building Plan Approval',
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          status: finalStatus,
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : 'Recent',
          mobile: c.property?.owner_phone || c.fullData?.mobile || '',
          originalCase: c,
        };
      });

      setPayments(mapped);
    } catch (err) {
      console.error('Failed to load payments:', err);
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

  // Metrics summary
  const totalRevenue = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.pendingAmount, 0);

  // User requirement: completely paid details not needed to show by default; only pending / partial datas needed
  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.id.toLowerCase().includes(q) ||
      p.customer.toLowerCase().includes(q) ||
      p.mobile.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL_PENDING') {
      // Show ONLY Pending & Partial (hide completely paid)
      return p.pendingAmount > 0;
    } else if (statusFilter === 'PENDING') {
      return p.status === 'Pending';
    } else if (statusFilter === 'PARTIAL') {
      return p.status === 'Partial';
    } else if (statusFilter === 'PAID') {
      return p.status === 'Paid';
    }
    return true; // ALL
  });

  const renderItem = ({ item }: { item: PaymentItem }) => {
    const isPartial = item.status === 'Partial';
    const isPaid = item.status === 'Paid';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/(admin)/application-detail',
            params: { id: item.mongoId || item.id },
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appId}>{item.id}</Text>
            <Text style={styles.customerName}>{item.customer}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isPaid ? styles.badgePaid : isPartial ? styles.badgePartial : styles.badgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPaid ? styles.textPaid : isPartial ? styles.textPartial : styles.textPending,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {item.mobile ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.mobile}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.infoText}>{item.date}</Text>
          </View>
        ) : null}

        {/* Amounts Breakdown Grid */}
        <View style={styles.amountsGrid}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountVal}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountVal, { color: Colors.successGreen }]}>
              ₹{item.paidAmount.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>Pending Balance</Text>
            <Text style={[styles.amountVal, { color: Colors.brandRed }]}>
              ₹{item.pendingAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.cardActions}>
          {item.mobile ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${item.mobile}`)}
            >
              <Ionicons name="call-outline" size={14} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() =>
              router.push({
                pathname: '/(admin)/application-detail',
                params: { id: item.mongoId || item.id },
              })
            }
          >
            <Ionicons name="card-outline" size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>Manage Payment</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Payments & Invoices" showBack />

      {/* KPI Tiles Header */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Revenue</Text>
          <Text style={styles.metricVal}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: Colors.successGreen }]}>
          <Text style={styles.metricLabel}>Collected</Text>
          <Text style={[styles.metricVal, { color: Colors.successGreen }]}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: Colors.warningGold }]}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={[styles.metricVal, { color: Colors.warningGold }]}>
            ₹{totalPending.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, customer, or phone..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'ALL_PENDING', label: 'Pending / Partial' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'PARTIAL', label: 'Partial' },
          { key: 'PAID', label: 'Paid' },
          { key: 'ALL', label: 'All' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, statusFilter === tab.key && styles.filterChipActive]}
            onPress={() => setStatusFilter(tab.key as any)}
          >
            <Text style={[styles.filterChipText, statusFilter === tab.key && styles.filterChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={50} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Outstanding Payments</Text>
              <Text style={styles.emptySub}>
                {statusFilter === 'ALL_PENDING'
                  ? 'All applications are fully paid or no pending records exist.'
                  : 'No payment records found matching this filter.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  searchSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 2,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  appId: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePartial: {
    backgroundColor: '#DBEAFE',
  },
  badgePaid: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textPending: {
    color: '#B45309',
  },
  textPartial: {
    color: '#1D4ED8',
  },
  textPaid: {
    color: '#15803D',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  amountsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: '#FFFFFF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});
