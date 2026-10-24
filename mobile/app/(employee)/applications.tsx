import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';

export default function EmployeeApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

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

  const filterOptions = ['ALL', 'IN_PROGRESS', 'DOCUMENTS_SUBMITTED', 'APPROVED'];

  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      item.applicationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      item.propertyDetails?.address?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = selectedFilter === 'ALL' || item.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const handleQuickWhatsApp = (item: Case, e: any) => {
    e.stopPropagation();
    const appNum = item.applicationNumber || item.application_number || item.id;
    const uploadLink = `https://building-approval.vercel.app/upload/${appNum}`;
    const custName = item.clientName || item.property?.owner_name || 'Customer';
    const rawPhone = item.property?.owner_phone || (item as any).phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const msg = `Hello ${custName},\n\nPlease use the following link to upload your required documents for application ${appNum}:\n${uploadLink}`;
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(waUrl);
  };

  const renderItem = ({ item }: { item: Case }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/(admin)/application-detail',
          params: { id: item.id || item._id },
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.appNumber}>{item.applicationNumber}</Text>
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoText}>
            {item.propertyDetails?.buildingType || 'Building'} ({item.propertyDetails?.plotArea || '0'} sq.ft)
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.propertyDetails?.address || 'Tamil Nadu'}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.cardWaBtn}
          onPress={(e) => handleQuickWhatsApp(item, e)}
        >
          <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
          <Text style={styles.cardWaText}>WhatsApp Link</Text>
        </TouchableOpacity>

        <View style={styles.actionPrompt}>
          <Text style={styles.actionPromptText}>Review / Update</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={[styles.searchBar, { flex: 1 }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search application number, client..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.newAppBtn}
            onPress={() => router.push('/(admin)/new-application')}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === item && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text style={[styles.filterText, selectedFilter === item && styles.filterTextActive]}>
                {item.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyText}>No applications found</Text>
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
    backgroundColor: colors.background,
  },
  searchSection: {
    backgroundColor: colors.card,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  card: {
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
  headerLeft: {
    flex: 1,
  },
  appNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  cardBody: {
    gap: 6,
    marginVertical: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  docsCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
  },
  cardWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  cardWaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  newAppBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
