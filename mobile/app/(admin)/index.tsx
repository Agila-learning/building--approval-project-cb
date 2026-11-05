import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/theme';
import { applicationService, leadService } from '../../services/applicationService';
import { Case, Lead } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { getApplicationStatus } from '../../utils/statusHelper';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [cases, setCases] = useState<Case[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Responsive calculations: 4 cols on wide screens (>= 768px), 2 cols on mobile
  const isWide = width >= 768;
  const paddingHorizontal = 32; // 16 * 2
  const gap = 10;
  const kpiCardWidth = isWide
    ? (width - paddingHorizontal - gap * 3) / 4
    : (width - paddingHorizontal - gap) / 2;

  // Quick action card width: 3 cols on mobile, 6 cols on wide
  const quickActionCols = isWide ? 6 : 3;
  const quickActionWidth =
    (width - paddingHorizontal - gap * (quickActionCols - 1)) / quickActionCols;

  const loadData = useCallback(async () => {
    try {
      const [casesRes, leadsRes] = await Promise.all([
        applicationService.getAll(),
        leadService.getAll(),
      ]);
      if (casesRes.data) setCases(casesRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
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

  const totalApps = cases.length;
  const approvedApps = cases.filter((c) => {
    const s = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
    return s.includes('APPROV') || s.includes('COMPLET');
  }).length;
  const pendingApps = cases.filter((c) => {
    const s = getApplicationStatus(c.application_number || c.id, c.status, c).toUpperCase();
    return !s.includes('APPROV') && !s.includes('REJECT');
  }).length;
  const totalLeads = leads.length;

  return (
    <View style={styles.container}>
      <MobileHeader title="Admin Dashboard" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 84, 98) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ======================================================== */}
        {/* 1. COMPACT & ATTRACTIVE 2x2 KPI EXECUTIVE CARDS          */}
        {/* ======================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Performance Metrics</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {/* KPI 1: Total Applications */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(admin)/applications')}
            style={[
              styles.compactKpiCard,
              { width: kpiCardWidth, borderLeftColor: '#1044C4' },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="folder-outline" size={16} color="#1044C4" />
              </View>
              <Text style={[styles.kpiPill, { color: '#1044C4', backgroundColor: '#EFF6FF' }]}>
                Total
              </Text>
            </View>
            <Text style={[styles.kpiNumber, { color: '#0F172A' }]}>{totalApps}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Total Applications</Text>
          </TouchableOpacity>

          {/* KPI 2: In Progress / Pending */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(admin)/applications')}
            style={[
              styles.compactKpiCard,
              { width: kpiCardWidth, borderLeftColor: '#D97706' },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="hourglass-outline" size={16} color="#B45309" />
              </View>
              <Text style={[styles.kpiPill, { color: '#B45309', backgroundColor: '#FEF9C3' }]}>
                Active
              </Text>
            </View>
            <Text style={[styles.kpiNumber, { color: '#B45309' }]}>{pendingApps}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>In Progress</Text>
          </TouchableOpacity>

          {/* KPI 3: Finally Approved */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(admin)/applications')}
            style={[
              styles.compactKpiCard,
              { width: kpiCardWidth, borderLeftColor: '#16A34A' },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-done-outline" size={16} color="#15803D" />
              </View>
              <Text style={[styles.kpiPill, { color: '#15803D', backgroundColor: '#DCFCE7' }]}>
                Approved
              </Text>
            </View>
            <Text style={[styles.kpiNumber, { color: '#15803D' }]}>{approvedApps}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Finally Approved</Text>
          </TouchableOpacity>

          {/* KPI 4: Customer Leads */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(admin)/customers')}
            style={[
              styles.compactKpiCard,
              { width: kpiCardWidth, borderLeftColor: '#0284C7' },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="people-outline" size={16} color="#0369A1" />
              </View>
              <Text style={[styles.kpiPill, { color: '#0369A1', backgroundColor: '#E0F2FE' }]}>
                Leads
              </Text>
            </View>
            <Text style={[styles.kpiNumber, { color: '#0284C7' }]}>{totalLeads}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Customer Leads</Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 2. DASHBOARD QUICK ACTIONS GRID                          */}
        {/* ======================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Primary shortcuts</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {/* Quick Action 1: New Application */}
          <TouchableOpacity
            style={[styles.quickActionTile, { width: quickActionWidth }]}
            onPress={() => router.push('/(admin)/new-application')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="add-circle" size={22} color="#1044C4" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={1}>New App</Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>Create Case</Text>
          </TouchableOpacity>

          {/* Quick Action 2: Approvals / Applications */}
          <TouchableOpacity
            style={[styles.quickActionTile, { width: quickActionWidth }]}
            onPress={() => router.push('/(admin)/applications')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkbox-outline" size={22} color="#059669" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={1}>Approvals</Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>Register</Text>
          </TouchableOpacity>

          {/* Quick Action 3: Attendance */}
          <TouchableOpacity
            style={[styles.quickActionTile, { width: quickActionWidth }]}
            onPress={() => router.push('/(admin)/attendance')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="calendar-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={1}>Attendance</Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>Daily Logs</Text>
          </TouchableOpacity>

          {/* Quick Action 4: Finance Hub */}
          <TouchableOpacity
            style={[styles.quickActionTile, { width: quickActionWidth }]}
            onPress={() => router.push('/(admin)/payments')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="wallet-outline" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={1}>Finance Hub</Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>Bills & Pay</Text>
          </TouchableOpacity>

          {/* Quick Action 5: Reports */}
          <TouchableOpacity
            style={[styles.quickActionTile, { width: quickActionWidth }]}
            onPress={() => router.push('/(admin)/reports')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="stats-chart-outline" size={22} color="#DC2626" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={1}>Reports</Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>PDF Export</Text>
          </TouchableOpacity>

          {/* Quick Action 6: Link Tracking */}
          <TouchableOpacity
            style={[styles.quickActionTile, { width: quickActionWidth }]}
            onPress={() => router.push('/(admin)/link-tracking')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="link-outline" size={22} color="#0284C7" />
            </View>
            <Text style={styles.quickActionTitle} numberOfLines={1}>Links</Text>
            <Text style={styles.quickActionSub} numberOfLines={1}>SMS Track</Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 3. RECENT APPLICATIONS                                   */}
        {/* ======================================================== */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/applications')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>No applications created yet.</Text>
          </View>
        ) : (
          cases.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.applicationCard}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: '/(admin)/application-detail',
                  params: { id: item.application_number || item.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.appNumBadge}>
                  <Text style={styles.appNumber}>{item.application_number || item.id}</Text>
                </View>
                <StatusBadge
                  status={item.status}
                  caseData={item}
                  id={item.application_number || item.id}
                />
              </View>

              <Text style={styles.customerName} numberOfLines={1}>
                {item.property?.owner_name || item.fullData?.customerName || 'Unknown Owner'}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.property?.village ||
                      item.property?.address ||
                      item.fullData?.propertyDetails?.village ||
                      'Tamil Nadu'}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString('en-GB')
                    : 'Recent'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure clean white background as requested
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  /* 2x2 Compact KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  compactKpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 78,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiPill: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  /* Quick Actions 3-Column Grid */
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  quickActionTile: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  quickActionSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },

  /* Application Cards */
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appNumBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
