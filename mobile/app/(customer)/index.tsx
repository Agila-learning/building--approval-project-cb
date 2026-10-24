import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Case } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';

export default function CustomerTrackScreen() {
  const insets = useSafeAreaInsets();
  const [appNumber, setAppNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCase, setFoundCase] = useState<Case | null>(null);

  const handleSearch = async () => {
    if (!appNumber.trim()) {
      Alert.alert('Required', 'Please enter your application number');
      return;
    }

    setSearching(true);
    setFoundCase(null);
    try {
      const cases = await applicationService.getCases();
      const match = cases.find(
        (c) =>
          c.applicationNumber?.toLowerCase() === appNumber.trim().toLowerCase() ||
          c.id === appNumber.trim() ||
          c._id === appNumber.trim()
      );

      if (match) {
        setFoundCase(match);
      } else {
        Alert.alert('Not Found', 'No application found with this reference number.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to search application');
    } finally {
      setSearching(false);
    }
  };

  const stages = [
    { key: 'SUBMITTED', title: 'Application Submitted' },
    { key: 'DOCUMENTS_SUBMITTED', title: 'Documents Verified' },
    { key: 'IN_PROGRESS', title: 'Department Scrutiny' },
    { key: 'APPROVED', title: 'Approval Order Issued' },
  ];

  const getStageCompleted = (status: string, stageKey: string) => {
    if (status === 'APPROVED' || status === 'COMPLETED') return true;
    if (stageKey === 'SUBMITTED') return true;
    if (stageKey === 'DOCUMENTS_SUBMITTED') {
      return ['DOCUMENTS_SUBMITTED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED'].includes(status);
    }
    if (stageKey === 'IN_PROGRESS') {
      return ['IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED'].includes(status);
    }
    return status === stageKey;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
    >
      {/* Search Header Card */}
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Track Your Building Approval</Text>
        <Text style={styles.searchSub}>
          Enter your Application Reference Number to check real-time status.
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="e.g. CBA-2024-001"
            placeholderTextColor={colors.textMuted}
            value={appNumber}
            onChangeText={setAppNumber}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.trackBtnText}>Track</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Found Application Details */}
      {foundCase && (
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.resultAppNumber}>{foundCase.applicationNumber}</Text>
                <Text style={styles.resultClient}>{foundCase.clientName}</Text>
              </View>
              <StatusBadge status={foundCase.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.label}>Building Type:</Text>
              <Text style={styles.val}>{foundCase.propertyDetails?.buildingType || 'Residential'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Plot Area:</Text>
              <Text style={styles.val}>{foundCase.propertyDetails?.plotArea || '0'} sq.ft</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.val}>{foundCase.propertyDetails?.address || 'Tamil Nadu'}</Text>
            </View>

            {/* Stepper Timeline */}
            <Text style={styles.timelineHeading}>Approval Progress</Text>
            <View style={styles.stepper}>
              {stages.map((stage, idx) => {
                const isCompleted = getStageCompleted(foundCase.status, stage.key);
                return (
                  <View key={stage.key} style={styles.stepItem}>
                    <View style={styles.stepIndicator}>
                      <View
                        style={[
                          styles.stepCircle,
                          isCompleted && { backgroundColor: colors.success },
                        ]}
                      >
                        <Ionicons
                          name={isCompleted ? 'checkmark' : 'ellipse'}
                          size={12}
                          color={isCompleted ? '#fff' : colors.textMuted}
                        />
                      </View>
                      {idx < stages.length - 1 && (
                        <View
                          style={[
                            styles.stepLine,
                            isCompleted && { backgroundColor: colors.success },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepTextContainer}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isCompleted && { color: colors.text, fontWeight: '700' },
                        ]}
                      >
                        {stage.title}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  searchSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  trackBtn: {
    backgroundColor: colors.primary,
    height: '100%',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  trackBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultContainer: {
    marginTop: spacing.xs,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultAppNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  resultClient: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  stepper: {
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 24,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  stepTextContainer: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
