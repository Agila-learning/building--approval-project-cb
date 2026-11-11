import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

interface CustomerMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenNotifications?: () => void;
}

export const CustomerMenuDrawer: React.FC<CustomerMenuDrawerProps> = ({
  visible,
  onClose,
  onOpenNotifications,
}) => {
  const { user, logout } = useAuth();
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleNavigate = (path: any) => {
    onClose();
    setTimeout(() => {
      router.replace(path);
    }, 150);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your customer account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await logout();
          },
        },
      ]
    );
  };

  const handleCall = () => {
    Linking.openURL('tel:+919842267890').catch(() => {
      Alert.alert('Helpline', 'Call us directly at +91 98422 67890');
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hello CB Building Approvals, I need assistance with my application.');
    Linking.openURL(`https://wa.me/919842267890?text=${msg}`).catch(() => {
      Alert.alert('WhatsApp', 'Please message us at +91 98422 67890');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@cbbuildingapprovals.com?subject=Application%20Inquiry').catch(() => {
      Alert.alert('Email', 'Email us at support@cbbuildingapprovals.com');
    });
  };

  const copyUpiId = () => {
    Clipboard.setString('cbapprovals@axisbank');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />

          {/* Drawer Content */}
          <View style={styles.drawerContainer}>
            {/* Header / User Card */}
            <View style={styles.drawerHeader}>
              <View style={styles.userInfoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'Valued Customer'}
                  </Text>
                  <Text style={styles.userPhone}>
                    {user?.phone ? `+91 ${user.phone}` : 'Citizen Portal'}
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>Citizen Portal</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Menu List */}
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>MY APPLICATION</Text>

              {/* Option 1: Track Status */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/(customer)')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="search-circle" size={22} color={Colors.primary} />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>Track Application Status</Text>
                  <Text style={styles.menuSub}>Real-time 5-stage timeline & details</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              {/* Option 2: Upload Documents */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/(customer)/upload')}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="cloud-upload" size={20} color="#D97706" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>Upload / Re-upload Docs</Text>
                  <Text style={styles.menuSub}>Blueprints, photos & identity proof</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              {/* Option 3: Fee Payment & Bank Info */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setBankModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="card" size={20} color="#15803D" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>Fee Payment & Bank Details</Text>
                  <Text style={styles.menuSub}>Official bank account & UPI ID</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>SUPPORT & ASSISTANCE</Text>

              {/* Support Action Cards */}
              <View style={styles.supportCard}>
                <Text style={styles.supportTitle}>Need Help With Your Approval?</Text>
                <Text style={styles.supportSub}>Our customer coordinator is available Mon-Sat, 9 AM - 7 PM</Text>
                <View style={styles.supportRow}>
                  <TouchableOpacity style={styles.supportActionBtn} onPress={handleCall}>
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.supportActionText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.supportActionBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.supportActionText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.supportActionBtn, { backgroundColor: '#0284C7' }]} onPress={handleEmail}>
                    <Ionicons name="mail" size={16} color="#FFFFFF" />
                    <Text style={styles.supportActionText}>Email</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionLabel}>ABOUT & PREFERENCES</Text>

              {/* About CB Approvals */}
              <View style={styles.aboutCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
                  <Text style={styles.aboutHeading}>CB Building Approvals</Text>
                </View>
                <Text style={styles.aboutTagline}>"Your Approvals. Our Responsibility"</Text>
                <Text style={styles.aboutText}>
                  Authorized liaison partner for DTCP, Panchayat Union, Town & Country Planning clearances across Tamil Nadu.
                </Text>
              </View>

              {/* Sign Out Button */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.75}
              >
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank & Payment Details Sheet */}
      <Modal
        visible={bankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bankOverlay}
          activeOpacity={1}
          onPress={() => setBankModalVisible(false)}
        >
          <View style={styles.bankSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.bankHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="business" size={20} color={Colors.primary} />
                <Text style={styles.bankHeaderTitle}>Official Payment Details</Text>
              </View>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.bankHeaderSub}>
              Please transfer your statutory scrutiny and application charges to the official account:
            </Text>

            <View style={styles.bankDetailsBox}>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Account Name:</Text>
                <Text style={styles.bankDetailVal}>CB BUILDING APPROVALS</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Bank Name:</Text>
                <Text style={styles.bankDetailVal}>Axis Bank Ltd</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Account Number:</Text>
                <Text style={styles.bankDetailValBold}>924020019842267</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>IFSC Code:</Text>
                <Text style={styles.bankDetailValBold}>UTIB0001234</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>Branch:</Text>
                <Text style={styles.bankDetailVal}>Gandhipuram, Coimbatore</Text>
              </View>
            </View>

            {/* UPI Option */}
            <View style={styles.upiCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upiLabel}>Official UPI ID:</Text>
                <Text style={styles.upiValue}>cbapprovals@axisbank</Text>
              </View>
              <TouchableOpacity
                style={[styles.copyBtn, copiedUpi && { backgroundColor: '#10B981' }]}
                onPress={copyUpiId}
              >
                <Ionicons name={copiedUpi ? 'checkmark' : 'copy-outline'} size={14} color="#FFFFFF" />
                <Text style={styles.copyBtnText}>{copiedUpi ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.paymentNote}>
              💡 Note: After completing your transfer, please upload the payment receipt under the "Upload Docs" section or share with your coordinator for instant receipt confirmation.
            </Text>

            <TouchableOpacity
              style={styles.closeBankBtn}
              onPress={() => setBankModalVisible(false)}
            >
              <Text style={styles.closeBankBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContainer: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userPhone: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  supportCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  supportSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 15,
  },
  supportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  supportActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  supportActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  aboutHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  aboutTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginVertical: 4,
  },
  aboutText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  bankOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bankSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 16,
  },
  bankDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  bankDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  bankDetailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  bankDetailValBold: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  upiCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  upiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  upiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  paymentNote: {
    fontSize: 11,
    color: '#92400E',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    lineHeight: 15,
  },
  closeBankBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeBankBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
