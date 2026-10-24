import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/theme';
import { applicationService, leadService } from '../../services/applicationService';
import { Case, Lead } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<Case[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  const approvedApps = cases.filter(c => (c.status || '').toUpperCase().includes('APPROV')).length;
  const pendingApps = cases.filter(c => !(c.status || '').toUpperCase().includes('APPROV') && !(c.status || '').toUpperCase().includes('REJECT')).length;
  const totalLeads = leads.length;

  return (
    <View style={styles.container}>
      <MobileHeader title="Admin Dashboard" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(admin)/new-application')}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>New Application</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.accent }]}
            onPress={() => router.push('/(admin)/link-tracking')}
          >
            <Ionicons name="link" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Link Tracking</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Cards Grid */}
        <Text style={styles.sectionHeader}>Overview Metrics</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.kpiValue}>{totalApps}</Text>
            <Text style={styles.kpiLabel}>Total Applications</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: Colors.warningGold }]}>
            <Text style={styles.kpiValue}>{pendingApps}</Text>
            <Text style={styles.kpiLabel}>In Progress / Pending</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: Colors.successGreen }]}>
            <Text style={styles.kpiValue}>{approvedApps}</Text>
            <Text style={styles.kpiLabel}>Approved Cases</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: Colors.infoGreen }]}>
            <Text style={styles.kpiValue}>{totalLeads}</Text>
            <Text style={styles.kpiLabel}>Enquiries & Leads</Text>
          </View>
        </View>

        {/* Quick Navigation Cards */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push('/(admin)/attendance')}
          >
            <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
            <Text style={styles.navTileTitle}>Attendance</Text>
            <Text style={styles.navTileSubtitle}>Staff Check-ins</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push('/(admin)/payments')}
          >
            <Ionicons name="card-outline" size={24} color={Colors.primary} />
            <Text style={styles.navTileTitle}>Payments</Text>
            <Text style={styles.navTileSubtitle}>Pending / Invoices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            onPress={() => router.push('/(admin)/reports')}
          >
            <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
            <Text style={styles.navTileTitle}>Reports</Text>
            <Text style={styles.navTileSubtitle}>Export & Summary</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Applications Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeader}>Recent Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/applications')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No applications created yet.</Text>
          </View>
        ) : (
          cases.slice(0, 5).map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.applicationCard}
              onPress={() =>
                router.push({
                  pathname: '/(admin)/application-detail',
                  params: { id: item.application_number || item.id },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.appNumber}>{item.application_number || item.id}</Text>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.customerName}>
                {item.property?.owner_name || item.fullData?.customerName || 'Unknown Owner'}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {item.property?.village || item.property?.address || item.fullData?.propertyDetails?.village || 'Tamil Nadu'}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : 'Recent'}
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
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  navTile: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  navTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 6,
  },
  navTileSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  applicationCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
