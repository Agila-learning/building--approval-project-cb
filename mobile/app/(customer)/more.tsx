import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerMoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleCall = () => {
    Linking.openURL('tel:+919842267890').catch(() => {
      Alert.alert('Helpline', 'Call us at +91 98422 67890');
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hello CB Building Approvals, I need assistance with my application.');
    Linking.openURL(`https://wa.me/919842267890?text=${msg}`).catch(() => {
      Alert.alert('WhatsApp', 'Message us at +91 98422 67890');
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 30, 50) }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Valued Customer'}</Text>
          <Text style={styles.userPhone}>
            {user?.phone ? `+91 ${user.phone}` : 'Citizen Portal'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Citizen Portal</Text>
          </View>
        </View>
      </View>

      {/* Section 1: My Application */}
      <Text style={styles.sectionHeading}>MY APPLICATION</Text>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => router.replace('/(customer)')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="search-circle" size={24} color={colors.primary} />
        </View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>Track Application Status</Text>
          <Text style={styles.menuSub}>Real-time 5-stage approval progress & details</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => router.replace('/(customer)/upload')}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cloud-upload" size={22} color="#D97706" />
        </View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>Upload & Re-upload Docs</Text>
          <Text style={styles.menuSub}>Submit plans, photos & identity clearances</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </TouchableOpacity>

      {/* Section 2: Fee & Bank Details */}
      <Text style={styles.sectionHeading}>PAYMENT & BANK DETAILS</Text>

      <View style={styles.bankCard}>
        <View style={styles.bankHeaderRow}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <Text style={styles.bankCardTitle}>Official Bank Account</Text>
        </View>

        <View style={styles.bankDetailsBox}>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Account Name:</Text>
            <Text style={styles.bankVal}>CB BUILDING APPROVALS</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Bank Name:</Text>
            <Text style={styles.bankVal}>Axis Bank Ltd</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Account Number:</Text>
            <Text style={styles.bankValBold}>924020019842267</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>IFSC Code:</Text>
            <Text style={styles.bankValBold}>UTIB0001234</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Branch:</Text>
            <Text style={styles.bankVal}>Gandhipuram, Coimbatore</Text>
          </View>
        </View>

        {/* UPI Card */}
        <View style={styles.upiRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.upiLabel}>Official UPI ID:</Text>
            <Text style={styles.upiVal}>cbapprovals@axisbank</Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, copiedUpi && { backgroundColor: '#10B981' }]}
            onPress={copyUpiId}
          >
            <Ionicons name={copiedUpi ? 'checkmark' : 'copy-outline'} size={14} color="#FFFFFF" />
            <Text style={styles.copyBtnText}>{copiedUpi ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bankNote}>
          💡 After completing your transfer, attach the receipt in the "Upload Docs" section or share with your coordinator for instant confirmation.
        </Text>
      </View>

      {/* Section 3: Helpline & Support */}
      <Text style={styles.sectionHeading}>HELPLINE & SUPPORT</Text>

      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need Immediate Assistance?</Text>
        <Text style={styles.supportSub}>Our coordinator is available Monday - Saturday, 9 AM - 7 PM</Text>
        <View style={styles.supportBtnRow}>
          <TouchableOpacity style={styles.supportBtn} onPress={handleCall}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.supportBtnText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.supportBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
            <Text style={styles.supportBtnText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.supportBtn, { backgroundColor: '#0284C7' }]} onPress={handleEmail}>
            <Ionicons name="mail" size={16} color="#FFFFFF" />
            <Text style={styles.supportBtnText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 4: About Company */}
      <Text style={styles.sectionHeading}>ABOUT CB BUILDING APPROVALS</Text>

      <View style={styles.aboutCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={styles.aboutTitle}>CB Building Approvals</Text>
        </View>
        <Text style={styles.aboutTagline}>"Your Approvals. Our Responsibility"</Text>
        <Text style={styles.aboutDesc}>
          Premier government liaison partner for DTCP, Panchayat Union, Town & Country Planning clearances, and completion certificates across Tamil Nadu.
        </Text>
      </View>

      {/* Section 5: Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bankCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bankDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bankLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  bankVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  bankValBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  upiRow: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  upiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  upiVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bankNote: {
    fontSize: 11,
    color: '#92400E',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    lineHeight: 15,
  },
  supportCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: spacing.sm,
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
  },
  supportBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 6,
    gap: 4,
  },
  supportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.lg,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  aboutTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginVertical: 4,
  },
  aboutDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
