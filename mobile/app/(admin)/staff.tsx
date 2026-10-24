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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { User } from '../../types';

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Add staff modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const loadData = async () => {
    try {
      const data = await applicationService.getUsers();
      setStaffList(data);
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

  const handleCreateStaff = async () => {
    if (!name || !username || !password) {
      Alert.alert('Required Fields', 'Please fill name, username and password');
      return;
    }

    setSubmitting(true);
    try {
      await applicationService.createUser({
        name,
        username,
        password,
        role,
        phone,
        email,
      });
      Alert.alert('Success', 'Staff member created successfully');
      setModalVisible(false);
      setName('');
      setUsername('');
      setPassword('');
      setPhone('');
      setEmail('');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
  );

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'ADMIN' ? colors.gold : colors.primary }]}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: item.role === 'ADMIN' ? '#FEF3C7' : '#EBF5FF' }]}>
          <Text style={[styles.badgeText, { color: item.role === 'ADMIN' ? '#B45309' : colors.primary }]}>
            {item.role}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        {item.phone ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
          >
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text style={styles.actionText}>{item.phone}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noContact}>No phone set</Text>
        )}

        {item.email && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`mailto:${item.email}`)}
          >
            <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
            <Text style={styles.actionText} numberOfLines={1}>{item.email}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <MobileHeader
        title="Staff Management"
        rightAction={
          <TouchableOpacity style={styles.headerAddBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search & Actions Header */}
      <View style={styles.headerArea}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff members..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item.id || item._id || item.username || String(index)}
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
              <Text style={styles.emptyText}>No staff members found</Text>
            </View>
          }
        />
      )}

      {/* Modal for adding staff */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Staff Member</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Username *"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.rolePickerRow}>
              <Text style={styles.roleLabel}>Role:</Text>
              <TouchableOpacity
                style={[styles.roleOption, role === 'STAFF' && styles.roleOptionActive]}
                onPress={() => setRole('STAFF')}
              >
                <Text style={[styles.roleOptionText, role === 'STAFF' && styles.roleOptionTextActive]}>
                  Staff / Employee
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === 'ADMIN' && styles.roleOptionActive]}
                onPress={() => setRole('ADMIN')}
              >
                <Text style={[styles.roleOptionText, role === 'ADMIN' && styles.roleOptionTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleCreateStaff}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Create Member</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerArea: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
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
  addBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  username: {
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
    marginTop: spacing.md,
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
  noContact: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  rolePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  roleOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  roleOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
