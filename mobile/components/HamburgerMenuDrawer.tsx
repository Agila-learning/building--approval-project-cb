import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

interface HamburgerMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenNotifications?: () => void;
}

export const HamburgerMenuDrawer: React.FC<HamburgerMenuDrawerProps> = ({
  visible,
  onClose,
  onOpenNotifications,
}) => {
  const { user, logout } = useAuth();

  // Collapsible category state
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const handleNavigate = (path: any) => {
    onClose();
    setTimeout(() => {
      router.push(path);
    }, 100);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Slide Drawer Content */}
        <View style={styles.drawerContainer}>
          {/* Drawer Top Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.userInfoRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Master Admin'}
                </Text>
                <Text style={styles.userRole}>
                  {user?.role === 'ADMIN' ? 'Administrator' : user?.role || 'Staff'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Navigation Categories List */}
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Category 1: Operations */}
            <View style={styles.categoryBlock}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => setOperationsOpen(!operationsOpen)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTitle}>OPERATIONS</Text>
                <Ionicons
                  name={operationsOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {operationsOpen && (
                <View style={styles.categoryItems}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigate('/(admin)/new-application')}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="add-circle" size={18} color="#1044C4" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>New Application</Text>
                      <Text style={styles.menuSub}>Create building approval case</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigate('/(admin)/attendance')}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="calendar" size={18} color="#B45309" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>Staff Attendance</Text>
                      <Text style={styles.menuSub}>Daily check-ins & records</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigate('/(admin)/link-tracking')}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: '#E0F2FE' }]}>
                      <Ionicons name="link" size={18} color="#0284C7" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>Link Tracking</Text>
                      <Text style={styles.menuSub}>Upload links & SMS monitoring</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category 2: Finance & Accounts */}
            <View style={styles.categoryBlock}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => setFinanceOpen(!financeOpen)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTitle}>FINANCE & ACCOUNTS</Text>
                <Ionicons
                  name={financeOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {financeOpen && (
                <View style={styles.categoryItems}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigate('/(admin)/payments')}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="wallet" size={18} color="#15803D" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>Finance Hub</Text>
                      <Text style={styles.menuSub}>Payments, Billings & Expenses</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category 3: Analytics & Audit */}
            <View style={styles.categoryBlock}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => setAnalyticsOpen(!analyticsOpen)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTitle}>ANALYTICS & AUDIT</Text>
                <Ionicons
                  name={analyticsOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {analyticsOpen && (
                <View style={styles.categoryItems}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleNavigate('/(admin)/reports')}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="stats-chart" size={18} color="#DC2626" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>Reports & PDF Export</Text>
                      <Text style={styles.menuSub}>Staff performance & audit</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category 4: System Actions */}
            <View style={[styles.categoryBlock, { borderBottomWidth: 0 }]}>
              <Text style={styles.categoryTitle}>SYSTEM</Text>
              <View style={styles.categoryItems}>
                {onOpenNotifications && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      onClose();
                      onOpenNotifications();
                    }}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="notifications" size={18} color="#022F94" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>Notifications</Text>
                      <Text style={styles.menuSub}>Activity alerts & logs</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.menuItem, { marginTop: 8 }]}
                  onPress={handleLogout}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Sign Out</Text>
                    <Text style={styles.menuSub}>End current administrative session</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer note */}
          <View style={styles.drawerFooter}>
            <Text style={styles.footerText}>C.B. Building Approvals ERP v1.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#022F94',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 44,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D6A756',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#022F94',
    fontSize: 18,
    fontWeight: '900',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userRole: {
    color: '#D6A756',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 30,
  },
  categoryBlock: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  categoryItems: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  drawerFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

