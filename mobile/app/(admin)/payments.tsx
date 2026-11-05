import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';

type FinanceTab = 'PAYMENTS' | 'BILLING' | 'EXPENSES';

interface PaymentItem {
  id: string;
  mongoId: string;
  customer: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Pending' | 'Partial' | 'Paid';
  date: string;
  mobile: string;
  originalCase: Case;
}

interface ExpenseItem {
  id: string;
  voucherNo: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  executive: string;
  mode: string;
  status: 'Approved' | 'Pending';
}

export default function FinanceHubScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Active Tab
  const [activeTab, setActiveTab] = useState<FinanceTab>('PAYMENTS');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'PAID'>('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  // Data States
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: 'exp_1',
      voucherNo: 'EXP-001',
      category: 'Site Inspection',
      description: 'Fuel and site conveyance for Shoolagiri layout inspection',
      amount: 1500,
      date: new Date().toISOString().split('T')[0],
      executive: 'Field Engineer',
      mode: 'UPI',
      status: 'Approved',
    },
    {
      id: 'exp_2',
      voucherNo: 'EXP-002',
      category: 'Government & Municipal Fees',
      description: 'DTCP Scrutiny fee submission challan',
      amount: 4500,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      executive: 'Admin',
      mode: 'Bank Transfer',
      status: 'Approved',
    },
    {
      id: 'exp_3',
      voucherNo: 'EXP-003',
      category: 'Office Supplies',
      description: 'A3 Plotter cartridge and drawing sheets',
      amount: 2800,
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      executive: 'Admin',
      mode: 'Cash',
      status: 'Approved',
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Expense Modal States
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpCategory, setNewExpCategory] = useState('Site Inspection');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpMode, setNewExpMode] = useState('Cash');
  const [newExpExec, setNewExpExec] = useState('Admin');

  // Load Cases and Payment Data
  const loadData = useCallback(async () => {
    try {
      const res = await applicationService.getAll();
      const casesData: Case[] = res.data || [];

      const mapped: PaymentItem[] = casesData.map((c: any) => {
        const total =
          Number(
            c.fees?.total ??
              c.fullData?.fees?.total ??
              (c.fullData?.feesAmount ? parseFloat(c.fullData.feesAmount) : 0)
          ) || 0;
        const paid =
          Number(
            c.fees?.paid ??
              c.fullData?.fees?.paid ??
              (c.fullData?.paidAmount ? parseFloat(c.fullData.paidAmount) : 0)
          ) || 0;
        const pending =
          c.fees?.pending !== undefined && c.fees?.pending !== null
            ? Number(c.fees.pending)
            : Math.max(0, total - paid);

        let finalStatus: 'Pending' | 'Partial' | 'Paid' = 'Pending';
        if (pending === 0 && total > 0) finalStatus = 'Paid';
        else if (paid > 0 && pending > 0) finalStatus = 'Partial';

        return {
          id: c.application_number || c.id,
          mongoId: c.id,
          customer: c.property?.owner_name || c.fullData?.customerName || 'Customer',
          type: c.approval_type || c.fullData?.serviceType || 'Building Approval',
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          status: finalStatus,
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : 'Recent',
          mobile: c.property?.owner_phone || c.fullData?.mobile || '',
          originalCase: c,
        };
      });

      setPayments(mapped);
    } catch (e) {
      console.error('Failed to load finance data:', e);
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

  // Financial KPI Metrics
  const metrics = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalCollected = payments.reduce((acc, p) => acc + p.paidAmount, 0);
    const totalPending = payments.reduce((acc, p) => acc + p.pendingAmount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netBalance = totalCollected - totalExpenses;

    return {
      totalRevenue,
      totalCollected,
      totalPending,
      totalExpenses,
      netBalance,
    };
  }, [payments, expenses]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.customer.toLowerCase().includes(q) ||
        p.mobile.includes(q);

      let matchesStatus = true;
      if (paymentStatusFilter === 'PAID') matchesStatus = p.status === 'Paid';
      else if (paymentStatusFilter === 'PARTIAL') matchesStatus = p.status === 'Partial';
      else if (paymentStatusFilter === 'PENDING') matchesStatus = p.status === 'Pending';

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, paymentStatusFilter]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.voucherNo.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.executive.toLowerCase().includes(q);

      const matchesCat =
        expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [expenses, search, expenseCategoryFilter]);

  // Add New Expense Handler
  const handleAddExpense = () => {
    const amt = parseFloat(newExpAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert('Required', 'Please enter a valid expense amount.');
      return;
    }

    const nextVoucher = `EXP-${String(expenses.length + 1).padStart(3, '0')}`;
    const newEntry: ExpenseItem = {
      id: `exp_${Date.now()}`,
      voucherNo: nextVoucher,
      category: newExpCategory,
      description: newExpDesc.trim() || `${newExpCategory} Expense`,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      executive: newExpExec.trim() || 'Admin',
      mode: newExpMode,
      status: 'Approved',
    };

    setExpenses([newEntry, ...expenses]);
    setExpenseModalOpen(false);
    setNewExpAmount('');
    setNewExpDesc('');
    Alert.alert('Success', `Expense voucher ${nextVoucher} recorded successfully.`);
  };

  // WhatsApp Reminder for Pending Payment
  const handleWhatsAppReminder = (item: PaymentItem) => {
    const rawPhone = item.mobile.replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    const msg = `Dear ${item.customer},\n\nGreetings from CB Building Approvals.\nThis is a reminder regarding the pending fee balance of ₹${item.pendingAmount.toLocaleString('en-IN')} for your application ${item.id}.\n\nTotal: ₹${item.totalAmount.toLocaleString('en-IN')}\nPaid: ₹${item.paidAmount.toLocaleString('en-IN')}\nBalance Due: ₹${item.pendingAmount.toLocaleString('en-IN')}\n\nBank / UPI: cbapprovals@upi\nThank you!`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  // Responsive KPI card width
  const isWide = width >= 768;
  const kpiWidth = isWide ? (width - 32 - 36) / 4 : (width - 32 - 12) / 2;

  return (
    <View style={styles.container}>
      <MobileHeader title="Finance & Billings" showBack />

      {/* Main Container */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 96) },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Top Segmented Tabs: Payments, Billing, Expenses */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'PAYMENTS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('PAYMENTS')}
          >
            <Ionicons
              name="cash"
              size={16}
              color={activeTab === 'PAYMENTS' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'PAYMENTS' && styles.tabBtnTextActive]}>
              Payments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'BILLING' && styles.tabBtnActive]}
            onPress={() => setActiveTab('BILLING')}
          >
            <Ionicons
              name="receipt"
              size={16}
              color={activeTab === 'BILLING' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'BILLING' && styles.tabBtnTextActive]}>
              Billing & Invoices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'EXPENSES' && styles.tabBtnActive]}
            onPress={() => setActiveTab('EXPENSES')}
          >
            <Ionicons
              name="wallet"
              size={16}
              color={activeTab === 'EXPENSES' ? '#FFFFFF' : Colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'EXPENSES' && styles.tabBtnTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Attractive Financial Overview KPI Cards */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Collected Fees */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: '#15803D' }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color="#15803D" />
              </View>
              <Text style={[styles.kpiTag, { color: '#15803D', backgroundColor: '#DCFCE7' }]}>
                Collected
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: '#15803D' }]}>
              ₹{metrics.totalCollected.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Total Client Receipts</Text>
          </View>

          {/* Card 2: Pending Balance */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: '#B45309' }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={18} color="#B45309" />
              </View>
              <Text style={[styles.kpiTag, { color: '#B45309', backgroundColor: '#FEF3C7' }]}>
                Pending
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: '#B45309' }]}>
              ₹{metrics.totalPending.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Outstanding Fees</Text>
          </View>

          {/* Card 3: Expenses Recorded */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: '#DC2626' }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="arrow-down-circle" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.kpiTag, { color: '#DC2626', backgroundColor: '#FEE2E2' }]}>
                Spent
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: '#DC2626' }]}>
              ₹{metrics.totalExpenses.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Vouchers & Expenses</Text>
          </View>

          {/* Card 4: Net Balance */}
          <View style={[styles.kpiCard, { width: kpiWidth, borderLeftColor: Colors.primary }]}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="bar-chart" size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.kpiTag, { color: Colors.primary, backgroundColor: '#EFF6FF' }]}>
                Net Cash
              </Text>
            </View>
            <Text style={[styles.kpiNum, { color: Colors.primary }]}>
              ₹{metrics.netBalance.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.kpiSub}>Operating Surplus</Text>
          </View>
        </View>

        {/* ================= TAB 1: PAYMENTS ================= */}
        {activeTab === 'PAYMENTS' && (
          <View>
            {/* Search and Filters */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by case ID, customer or phone..."
                  placeholderTextColor={Colors.textSecondary}
                  value={search}
                  onChangeText={setSearch}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Status Pills */}
            <View style={styles.statusPillsRow}>
              {(['ALL', 'PENDING', 'PARTIAL', 'PAID'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.pill, paymentStatusFilter === st && styles.pillActive]}
                  onPress={() => setPaymentStatusFilter(st)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      paymentStatusFilter === st && styles.pillTextActive,
                    ]}
                  >
                    {st === 'ALL' ? 'All Payments' : st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.listHeading}>
              Customer Payments & Receipts ({filteredPayments.length})
            </Text>

            {filteredPayments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Payment Records</Text>
                <Text style={styles.emptySub}>No applications matching the selected criteria.</Text>
              </View>
            ) : (
              filteredPayments.map((item, idx) => (
                <View key={`pay_${item.id}_${idx}`} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemId}>{item.id}</Text>
                      <Text style={styles.itemCustomer}>{item.customer}</Text>
                      {item.mobile ? (
                        <Text style={styles.itemSub}>{item.mobile}</Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'Paid'
                          ? styles.badgePaid
                          : item.status === 'Partial'
                          ? styles.badgePartial
                          : styles.badgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.status === 'Paid'
                            ? styles.textPaid
                            : item.status === 'Partial'
                            ? styles.textPartial
                            : styles.textPending,
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Amounts Grid */}
                  <View style={styles.feeRow}>
                    <View style={styles.feeCol}>
                      <Text style={styles.feeLabel}>Total Fee</Text>
                      <Text style={styles.feeVal}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.feeCol}>
                      <Text style={styles.feeLabel}>Amount Paid</Text>
                      <Text style={[styles.feeVal, { color: '#15803D' }]}>
                        ₹{item.paidAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.feeCol}>
                      <Text style={styles.feeLabel}>Balance Due</Text>
                      <Text style={[styles.feeVal, { color: '#B45309' }]}>
                        ₹{item.pendingAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Action Footer */}
                  <View style={styles.itemFooter}>
                    <Text style={styles.dateLabel}>Date: {item.date}</Text>

                    {item.pendingAmount > 0 && (
                      <TouchableOpacity
                        style={styles.remindBtn}
                        onPress={() => handleWhatsAppReminder(item)}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                        <Text style={styles.remindBtnText}>Send Reminder</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 2: BILLING & INVOICES ================= */}
        {activeTab === 'BILLING' && (
          <View>
            {/* Company Bank & UPI Details */}
            <View style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <Ionicons name="business" size={20} color={Colors.primary} />
                <Text style={styles.bankTitle}>Official Billing Account</Text>
              </View>
              <Text style={styles.bankSub}>
                Provide these verified payment credentials to clients for direct transfers:
              </Text>

              <View style={styles.bankDetailRow}>
                <Text style={styles.bankKey}>Beneficiary:</Text>
                <Text style={styles.bankVal}>C.B. BUILDING APPROVALS</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankKey}>Bank & Branch:</Text>
                <Text style={styles.bankVal}>State Bank of India, Shoolagiri Main</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankKey}>Account Number:</Text>
                <Text style={styles.bankVal}>40123456789</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankKey}>IFSC Code:</Text>
                <Text style={styles.bankVal}>SBIN0001234</Text>
              </View>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankKey}>UPI ID:</Text>
                <Text style={[styles.bankVal, { color: Colors.primary }]}>cbapprovals@upi</Text>
              </View>
            </View>

            {/* Invoices List */}
            <Text style={styles.listHeading}>
              Active Billing Schedules ({payments.length})
            </Text>

            {payments.map((p, idx) => (
              <View key={`bill_${p.id}_${idx}`} style={styles.billCard}>
                <View style={styles.itemTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billId}>INVOICE #{p.id}</Text>
                    <Text style={styles.billCustomer}>{p.customer}</Text>
                    <Text style={styles.billType}>{p.type}</Text>
                  </View>
                  <View style={styles.billAmountWrap}>
                    <Text style={styles.billAmountLabel}>Invoice Total</Text>
                    <Text style={styles.billAmountNum}>
                      ₹{p.totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.billProgressRow}>
                  <View style={styles.billProgressBar}>
                    <View
                      style={[
                        styles.billProgressFill,
                        {
                          width: `${
                            p.totalAmount > 0
                              ? Math.min(100, Math.round((p.paidAmount / p.totalAmount) * 100))
                              : 0
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.billProgressText}>
                    {p.totalAmount > 0
                      ? Math.round((p.paidAmount / p.totalAmount) * 100)
                      : 0}
                    % Settled
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 3: EXPENSES ================= */}
        {activeTab === 'EXPENSES' && (
          <View>
            {/* Top Bar with Add Expense Button */}
            <View style={styles.expenseTopBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseHeading}>Expense Vouchers</Text>
                <Text style={styles.expenseSub}>Track office, field and legal expenditures</Text>
              </View>
              <TouchableOpacity
                style={styles.addExpenseBtn}
                onPress={() => setExpenseModalOpen(true)}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addExpenseBtnText}>+ Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  'ALL',
                  'Site Inspection',
                  'Government & Municipal Fees',
                  'Office Supplies',
                  'Travel & Fuel',
                  'Maintenance & Repairs',
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.pill,
                      expenseCategoryFilter === cat && styles.pillActive,
                    ]}
                    onPress={() => setExpenseCategoryFilter(cat)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        expenseCategoryFilter === cat && styles.pillTextActive,
                      ]}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Expense List */}
            {filteredExpenses.map((exp, idx) => (
              <View key={`exp_${exp.id}_${idx}`} style={styles.expenseCard}>
                <View style={styles.itemTop}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.voucherNum}>{exp.voucherNo}</Text>
                      <View style={styles.expCatBadge}>
                        <Text style={styles.expCatText}>{exp.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.expDesc}>{exp.description}</Text>
                  </View>

                  <Text style={styles.expAmount}>
                    -₹{exp.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.expMetaRow}>
                  <Text style={styles.expMetaText}>Date: {exp.date}</Text>
                  <Text style={styles.expMetaText}>By: {exp.executive}</Text>
                  <Text style={styles.expMetaText}>Mode: {exp.mode}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL: Add New Expense Voucher */}
      <Modal
        visible={expenseModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExpenseModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Expense Voucher</Text>
              <TouchableOpacity onPress={() => setExpenseModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.catGrid}>
                {[
                  'Site Inspection',
                  'Government & Municipal Fees',
                  'Office Supplies',
                  'Travel & Fuel',
                  'Marketing & Ads',
                  'Maintenance & Repairs',
                ].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.catBtn,
                      newExpCategory === c && styles.catBtnActive,
                    ]}
                    onPress={() => setNewExpCategory(c)}
                  >
                    <Text
                      style={[
                        styles.catBtnText,
                        newExpCategory === c && styles.catBtnTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Amount (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 2500"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={newExpAmount}
                onChangeText={setNewExpAmount}
              />

              <Text style={styles.inputLabel}>Description / Purpose *</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                placeholder="Details of expense incurred..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                value={newExpDesc}
                onChangeText={setNewExpDesc}
              />

              <Text style={styles.inputLabel}>Payment Mode</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.modeBtn,
                      newExpMode === m && styles.modeBtnActive,
                    ]}
                    onPress={() => setNewExpMode(m)}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        newExpMode === m && styles.modeBtnTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Executive Incurred</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Admin or Staff Name"
                placeholderTextColor={Colors.textSecondary}
                value={newExpExec}
                onChangeText={setNewExpExec}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setExpenseModalOpen(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.modalSubmitText}>Save Voucher</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTag: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kpiNum: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  searchRow: {
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 9 : 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  listHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    elevation: 2,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemId: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  itemSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePaid: {
    backgroundColor: '#DCFCE7',
  },
  badgePartial: {
    backgroundColor: '#FEF3C7',
  },
  badgePending: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textPaid: {
    color: '#15803D',
  },
  textPartial: {
    color: '#B45309',
  },
  textPending: {
    color: '#B91C1C',
  },
  feeRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  feeCol: {
    flex: 1,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  feeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  remindBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Bank Info Card */
  bankCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  bankSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  bankKey: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bankVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  /* Billing Card */
  billCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  billId: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  billCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  billType: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  billAmountWrap: {
    alignItems: 'flex-end',
  },
  billAmountLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  billAmountNum: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  billProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  billProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  billProgressFill: {
    height: '100%',
    backgroundColor: '#15803D',
    borderRadius: 3,
  },
  billProgressText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  /* Expenses */
  expenseTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  expenseSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  expenseCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  voucherNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  expCatBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expCatText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  expDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  expAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  expMetaRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    marginTop: 8,
  },
  expMetaText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 9 : 6,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catBtnTextActive: {
    color: '#FFFFFF',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
