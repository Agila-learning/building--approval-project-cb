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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Lead } from '../../types';

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const data = await applicationService.getLeads();
      setCustomers(data);
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

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.service?.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Lead }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'C'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.service}>{item.service || 'Building Approval'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.status === 'NEW' ? '#EBF5FF' : '#E8F5E9' }]}>
          <Text style={[styles.badgeText, { color: item.status === 'NEW' ? colors.primary : colors.success }]}>
            {item.status || 'CONTACTED'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
        >
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <Text style={styles.actionText}>{item.phone || 'No phone'}</Text>
        </TouchableOpacity>

        {item.email && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`mailto:${item.email}`)}
          >
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <Text style={styles.actionText} numberOfLines={1}>{item.email}</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}

      {item.notes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <MobileHeader title="Customer Directory" />

      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, service..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item.id || String(index)}
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
              <Ionicons name="people-outline" size={54} color={colors.textMuted} />
              <Text style={styles.emptyText}>No customer records found</Text>
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  service: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  actionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  notesBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  notesText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
  },
});
