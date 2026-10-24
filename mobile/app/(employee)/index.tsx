import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';

export default function EmployeeDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
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

  // Filter assigned cases (or show all in progress if none assigned explicitly)
  const assignedCases = cases.filter(
    (c) =>
      c.assignedTo === user?.name ||
      c.assignedTo === user?.username ||
      c.status === 'IN_PROGRESS' ||
      c.status === 'DOCUMENTS_SUBMITTED'
  );

  const pendingVerification = cases.filter(
    (c) => c.status === 'DOCUMENTS_SUBMITTED'
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}
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
      {/* Welcome Banner */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>Hello, {user?.name || 'Staff'}</Text>
          <Text style={styles.welcomeSub}>Field Staff & Approvals Portal</Text>
        </View>
        <Ionicons name="shield-checkmark" size={32} color={colors.gold} />
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{assignedCases.length}</Text>
          <Text style={styles.metricLabel}>Active Tasks</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.gold }]}>{pendingVerification}</Text>
          <Text style={styles.metricLabel}>Docs Pending</Text>
        </View>
      </View>

      {/* Priority Tasks List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assigned Applications</Text>
        <TouchableOpacity onPress={() => router.push('/(employee)/applications')}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : assignedCases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.success} />
          <Text style={styles.emptyText}>All caught up! No pending applications.</Text>
        </View>
      ) : (
        assignedCases.slice(0, 5).map((item) => (
          <TouchableOpacity
            key={item.id || item._id}
            style={styles.caseCard}
            onPress={() =>
              router.push({
                pathname: '/(admin)/application-detail',
                params: { id: item.id || item._id },
              })
            }
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.caseNumber}>{item.applicationNumber}</Text>
                <Text style={styles.clientName}>{item.clientName}</Text>
              </View>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.detailsRow}>
              <Ionicons name="business-outline" size={14} color={colors.textMuted} />
              <Text style={styles.propertyText}>
                {item.propertyDetails?.buildingType || 'Residential'} • {item.propertyDetails?.district || 'Coimbatore'}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: colors.deepBlue,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  welcomeSub: {
    fontSize: 13,
    color: '#D0D5DD',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  caseCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  caseNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  propertyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
