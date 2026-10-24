import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await applicationService.getCases();
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCases = cases.length;
  const approvedCases = cases.filter((c) => c.status === 'APPROVED' || c.status === 'COMPLETED').length;
  const inProgressCases = cases.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'DOCUMENTS_SUBMITTED' || c.status === 'PENDING_APPROVAL'
  ).length;
  const rejectedCases = cases.filter((c) => c.status === 'REJECTED').length;

  // Robust fee extraction supporting both MongoDB schema c.fees and legacy/form c.fullData
  const getCaseFee = (c: Case) => {
    const total = Number(c.fees?.total ?? c.fullData?.fees?.total ?? (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)) || 0;
    const paid = Number(c.fees?.paid ?? c.fullData?.fees?.paid ?? (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)) || 0;
    const pending = c.fees?.pending !== undefined ? Number(c.fees.pending) : Math.max(0, total - paid);
    return { total, paid, pending };
  };

  const totalFeeCollected = cases.reduce((acc, c) => acc + getCaseFee(c).paid, 0);
  const totalFeePending = cases.reduce((acc, c) => acc + getCaseFee(c).pending, 0);

  // Filter only applications with pending/partial fees (hide completely paid)
  const pendingPaymentCases = cases.filter((c) => {
    const { pending, total } = getCaseFee(c);
    return total > 0 && pending > 0;
  });

  return (
    <View style={styles.container}>
      <MobileHeader title="Analytics & Reports" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.title}>Overview & Performance</Text>
        <Text style={styles.subtitle}>Real-time application metrics and fee tracking</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Revenue Summary */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>Fee & Financial Overview</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.statLabel}>Collected Fees</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  ₹{totalFeeCollected.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#FEF2F2' }]}>
                <Text style={styles.statLabel}>Pending Balance</Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>
                  ₹{totalFeePending.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Pending & Partial Payments Card List */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>Pending / Partial Fees ({pendingPaymentCases.length})</Text>
            </View>
            <Text style={styles.pendingSectionSub}>
              Only showing applications with outstanding balances. Fully settled applications are hidden.
            </Text>

            {pendingPaymentCases.length === 0 ? (
              <View style={styles.emptyPendingBox}>
                <Ionicons name="checkmark-done-circle" size={32} color={colors.success} />
                <Text style={styles.emptyPendingText}>All applications have been fully paid!</Text>
              </View>
            ) : (
              pendingPaymentCases.map((c) => {
                const { total, paid, pending } = getCaseFee(c);
                const appId = c.application_number || c.id;
                const custName = c.property?.owner_name || c.fullData?.customerName || 'Customer';
                const phone = c.property?.owner_phone || c.fullData?.mobile || '';
                const isPartial = paid > 0 && pending > 0;

                return (
                  <View key={c.id} style={styles.pendingItem}>
                    <View style={styles.pendingTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pendingAppId}>{appId}</Text>
                        <Text style={styles.pendingName}>{custName}</Text>
                        {phone ? <Text style={styles.pendingPhone}>{phone}</Text> : null}
                      </View>
                      <View style={[styles.statusBadge, isPartial ? styles.badgePartial : styles.badgePending]}>
                        <Text style={[styles.statusBadgeText, isPartial ? styles.textPartial : styles.textPending]}>
                          {isPartial ? 'Partial' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.pendingFeeRow}>
                      <View style={styles.feeCol}>
                        <Text style={styles.feeColLabel}>Total</Text>
                        <Text style={styles.feeColVal}>₹{total.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.feeCol}>
                        <Text style={styles.feeColLabel}>Paid</Text>
                        <Text style={[styles.feeColVal, { color: colors.success }]}>₹{paid.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.feeCol}>
                        <Text style={styles.feeColLabel}>Pending</Text>
                        <Text style={[styles.feeColVal, { color: colors.danger }]}>₹{pending.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Status Breakdown */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Application Status Breakdown</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
                <Text style={styles.statusName}>Total Applications</Text>
              </View>
              <Text style={styles.statusCount}>{totalCases}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.indicator, { backgroundColor: colors.success }]} />
                <Text style={styles.statusName}>Approved / Completed</Text>
              </View>
              <Text style={styles.statusCount}>{approvedCases}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.indicator, { backgroundColor: colors.gold }]} />
                <Text style={styles.statusName}>In Progress / Pending</Text>
              </View>
              <Text style={styles.statusCount}>{inProgressCases}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.indicatorEmpty}>
                <View style={[styles.indicator, { backgroundColor: colors.danger }]} />
                <Text style={styles.statusName}>Rejected</Text>
              </View>
              <Text style={styles.statusCount}>{rejectedCases}</Text>
            </View>
          </View>

          {/* Operational Efficiency */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.deepBlue} />
              <Text style={styles.sectionTitle}>Performance Rates</Text>
            </View>

            <View style={styles.metricItem}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>Approval Rate</Text>
                <Text style={styles.metricPercent}>
                  {totalCases > 0 ? Math.round((approvedCases / totalCases) * 100) : 0}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${totalCases > 0 ? Math.round((approvedCases / totalCases) * 100) : 0}%`,
                      backgroundColor: colors.success,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicatorEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  statusCount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  metricItem: {
    marginTop: spacing.xs,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  metricPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  pendingSectionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  emptyPendingBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  emptyPendingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  pendingItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  pendingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pendingAppId: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  pendingName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  pendingPhone: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
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
  pendingFeeRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  feeCol: {
    flex: 1,
  },
  feeColLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  feeColVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 1,
  },
});
