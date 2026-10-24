import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ApplicationsListScreen() {
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      const res = await applicationService.getAll();
      if (res.data) setCases(res.data);
    } catch (err) {
      console.error(err);
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

  const filtered = cases.filter(item => {
    const q = search.toLowerCase();
    const appNum = (item.application_number || item.id || '').toLowerCase();
    const name = (item.property?.owner_name || item.fullData?.customerName || '').toLowerCase();
    const phone = (item.property?.owner_phone || item.fullData?.mobile || '').toLowerCase();
    const matchesSearch = appNum.includes(q) || name.includes(q) || phone.includes(q);

    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    const st = (item.status || '').toUpperCase();
    if (selectedFilter === 'APPROVED') return st.includes('APPROV');
    if (selectedFilter === 'PENDING') return !st.includes('APPROV') && !st.includes('REJECT');
    if (selectedFilter === 'REJECTED') return st.includes('REJECT');
    return true;
  });

  const handleQuickWhatsApp = (item: Case, e: any) => {
    e.stopPropagation();
    const appNum = item.application_number || item.id;
    const uploadLink = `https://building-approval.vercel.app/upload/${appNum}`;
    const custName = item.property?.owner_name || item.fullData?.customerName || 'Customer';
    const rawPhone = item.property?.owner_phone || item.fullData?.mobile || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const msg = `Hello ${custName},\n\nPlease use the following link to upload your required documents for building approval application ${appNum}:\n${uploadLink}`;
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(waUrl);
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Applications" />

      {/* Search & Actions Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, name, or phone..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(admin)/new-application')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, selectedFilter === f && styles.chipActive]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text style={[styles.chipText, selectedFilter === f && styles.chipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search criteria or create a new application.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
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

              <Text style={styles.ownerName}>
                {item.property?.owner_name || item.fullData?.customerName || 'Draft Owner'}
              </Text>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  {item.property?.owner_phone || item.fullData?.mobile || 'No phone'}
                </Text>

                <Ionicons name="location-outline" size={13} color={Colors.textSecondary} style={{ marginLeft: 12 }} />
                <Text style={styles.infoText}>
                  {item.property?.village || item.property?.address || 'Tamil Nadu'}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeText}>{item.approval_type || 'Building Plan Approval'}</Text>
                  <Text style={styles.dateText}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : 'Recent'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cardWaBtn}
                  onPress={(e) => handleQuickWhatsApp(item, e)}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                  <Text style={styles.cardWaText}>Upload Link</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
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
  topBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 42,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  itemCard: {
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
  },
  appNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  typeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  cardWaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
