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
  Share,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';

const WEB_BASE_URL = 'https://building-approval.vercel.app';

export default function LinkTrackingScreen() {
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await applicationService.getAll();
      if (res.data) {
        setCases(res.data);
      }
    } catch (err) {
      console.error('Failed to load cases for link tracking:', err);
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

  const handleSendLinkWhatsApp = async (item: Case) => {
    const appId = item.application_number || item.id;
    const phone = item.property?.owner_phone || item.fullData?.mobile || '';
    const customerName = item.property?.owner_name || item.fullData?.customerName || 'Customer';

    if (!phone) {
      Alert.alert('Phone Required', 'No mobile number found for this applicant.');
      return;
    }

    setSendingId(item.id);
    const cleanPhone = phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const uploadUrl = `${WEB_BASE_URL}/upload/${appId}`;
    const msg = `Hello ${customerName},\n\nPlease use the following link to upload your required documents for Building Approval Application *${appId}*:\n\n${uploadUrl}\n\nThank you,\nCB Building Approvals`;

    const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;

    try {
      const supported = await Linking.canOpenURL(waUrl);
      if (supported) {
        await Linking.openURL(waUrl);
      } else {
        await Share.share({
          title: `Upload Link - ${appId}`,
          message: msg,
        });
      }

      // Update link tracking status in backend
      const updatedTracking = {
        sent: true,
        sendStatus: 'success',
        sentDate: new Date().toISOString(),
        customerUploaded: item.linkTracking?.customerUploaded || false,
        uploadDate: item.linkTracking?.uploadDate || undefined,
      };

      await applicationService.update(item.id, {
        linkTracking: updatedTracking,
      });

      // Update local state
      setCases(prev =>
        prev.map(c => (c.id === item.id ? { ...c, linkTracking: updatedTracking } : c))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send link');
    } finally {
      setSendingId(null);
    }
  };

  const handleShareLink = async (item: Case) => {
    const appId = item.application_number || item.id;
    const uploadUrl = `${WEB_BASE_URL}/upload/${appId}`;
    try {
      await Share.share({
        title: `Upload Documents - ${appId}`,
        message: `Upload Link for Application ${appId}:\n${uploadUrl}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = cases.filter(item => {
    const q = search.toLowerCase();
    const appNum = (item.application_number || item.id || '').toLowerCase();
    const name = (item.property?.owner_name || item.fullData?.customerName || '').toLowerCase();
    const phone = (item.property?.owner_phone || item.fullData?.mobile || '').toLowerCase();
    return appNum.includes(q) || name.includes(q) || phone.includes(q);
  });

  const totalLinksSent = cases.filter(c => c.linkTracking?.sent).length;
  const totalUploaded = cases.filter(c => c.linkTracking?.customerUploaded).length;

  const renderItem = ({ item }: { item: Case }) => {
    const appId = item.application_number || item.id;
    const customer = item.property?.owner_name || item.fullData?.customerName || 'Customer';
    const mobile = item.property?.owner_phone || item.fullData?.mobile || 'No mobile';
    const tracking = item.linkTracking || {};
    const isSent = !!tracking.sent;
    const isUploaded = !!tracking.customerUploaded;
    const sentDate = tracking.sentDate ? new Date(tracking.sentDate).toLocaleDateString('en-GB') : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appId}>{appId}</Text>
            <Text style={styles.customerName}>{customer}</Text>
          </View>
          <View style={styles.badgeRow}>
            {isSent ? (
              <View style={[styles.badge, styles.badgeSent]}>
                <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                <Text style={styles.badgeTextSent}>Sent</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgePending]}>
                <Ionicons name="time-outline" size={12} color="#B45309" />
                <Text style={styles.badgeTextPending}>Pending</Text>
              </View>
            )}

            {isUploaded ? (
              <View style={[styles.badge, styles.badgeUploaded]}>
                <Ionicons name="cloud-done-outline" size={12} color="#1D4ED8" />
                <Text style={styles.badgeTextUploaded}>Docs Uploaded</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeWaiting]}>
                <Text style={styles.badgeTextWaiting}>Awaiting Docs</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{mobile}</Text>
          {sentDate && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>Sent: {sentDate}</Text>
            </>
          )}
        </View>

        {/* Link URL Preview */}
        <View style={styles.urlBox}>
          <Ionicons name="link-outline" size={14} color={Colors.primary} />
          <Text style={styles.urlText} numberOfLines={1}>
            {`${WEB_BASE_URL}/upload/${appId}`}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.sendWaBtn}
            onPress={() => handleSendLinkWhatsApp(item)}
            disabled={sendingId === item.id}
          >
            {sendingId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.sendWaBtnText}>{isSent ? 'Resend Link' : 'Send Link'}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={() => handleShareLink(item)}>
            <Ionicons name="share-outline" size={16} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() =>
              router.push({
                pathname: '/(admin)/application-detail',
                params: { id: item.id },
              })
            }
          >
            <Text style={styles.viewBtnText}>View App</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Link Tracking" showBack />

      {/* KPI Overview Header */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>{cases.length}</Text>
          <Text style={styles.metricLabel}>Total Apps</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: Colors.primary }]}>
          <Text style={[styles.metricVal, { color: Colors.primary }]}>{totalLinksSent}</Text>
          <Text style={styles.metricLabel}>Links Sent</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: Colors.successGreen }]}>
          <Text style={[styles.metricVal, { color: Colors.successGreen }]}>{totalUploaded}</Text>
          <Text style={styles.metricLabel}>Docs Received</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by application no, customer or phone..."
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
              <Ionicons name="link-outline" size={50} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySub}>Applications created will show their document upload links here.</Text>
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
    borderLeftColor: Colors.warningGold,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
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
  cardTop: {
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
  badgeRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSent: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextSent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextPending: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeUploaded: {
    backgroundColor: '#DBEAFE',
  },
  badgeTextUploaded: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  badgeWaiting: {
    backgroundColor: '#F3F4F6',
  },
  badgeTextWaiting: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 12,
  },
  urlText: {
    flex: 1,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  sendWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  sendWaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  shareBtn: {
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
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
    paddingHorizontal: 40,
  },
});
