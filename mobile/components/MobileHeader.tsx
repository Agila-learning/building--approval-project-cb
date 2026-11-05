import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../services/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  case_id?: string | null;
  created_at?: string;
}

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiRequest<NotificationItem[]>('/notifications');
      if (res.data && Array.isArray(res.data)) {
        setNotifications(res.data);
        const unread = res.data.filter((n) => !n.read).length;
        setUnreadCount(unread > 0 ? unread : 0);
      }
    } catch (err) {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleOpenNotifications = () => {
    setModalOpen(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    setModalOpen(false);
    if (item.case_id) {
      router.push({
        pathname: '/(admin)/application-detail',
        params: { id: item.case_id },
      });
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => (onBack ? onBack() : router.back())}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../assets/logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {user && !showBack && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {user.name} • {user.role === 'ADMIN' ? 'Administrator' : user.role}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightRow}>
          {rightAction}

          {/* Notification Bell Icon */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={handleOpenNotifications}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Logout Icon (Shown only on top-level pages) */}
          {!showBack && (
            <TouchableOpacity onPress={logout} style={styles.logoutButton} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications Slide-in / Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="notifications" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadTag}>
                    <Text style={styles.unreadTagText}>{unreadCount} New</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={styles.markAllReadText}>Mark read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {loadingNotes ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyNoteTitle}>No New Notifications</Text>
                <Text style={styles.emptyNoteSub}>
                  You're all caught up with building approval activity!
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isApp = item.type === 'APPLICATION';
                  const isStaff = item.type === 'STAFF';

                  return (
                    <TouchableOpacity
                      style={[styles.notificationCard, !item.read && styles.unreadCard]}
                      onPress={() => handleNotificationPress(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.noteIconWrap,
                          {
                            backgroundColor: isApp
                              ? '#EFF6FF'
                              : isStaff
                              ? '#FEF3C7'
                              : '#DCFCE7',
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            isApp
                              ? 'document-text'
                              : isStaff
                              ? 'person-add'
                              : 'notifications'
                          }
                          size={18}
                          color={
                            isApp
                              ? Colors.primary
                              : isStaff
                              ? '#B45309'
                              : '#15803D'
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.noteTitleRow}>
                          <Text style={styles.noteTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.noteTime}>
                            {formatTimeAgo(item.created_at)}
                          </Text>
                        </View>
                        <Text style={styles.noteMessage}>{item.message}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#022F94',
  },
  container: {
    backgroundColor: '#022F94',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    color: '#D6A756',
    fontWeight: '600',
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    padding: 7,
    position: 'relative',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#022F94',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  logoutButton: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  unreadTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadTagText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '800',
  },
  markAllReadText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalCenter: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyNoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptyNoteSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  unreadCard: {
    backgroundColor: '#F0F7FF',
    borderColor: '#BFDBFE',
  },
  noteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  noteTime: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  noteMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
});
