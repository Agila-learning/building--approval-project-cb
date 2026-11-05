import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getApplicationStatus } from '../utils/statusHelper';

interface StatusBadgeProps {
  status?: string;
  caseData?: any;
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'PENDING', caseData, id }) => {
  const syncedStatus = getApplicationStatus(id || '', status, caseData);
  const s = syncedStatus.toUpperCase().replace(/\s+/g, '_');

  let bgColor = '#f1f5f9';
  let color = '#475569';
  let borderColor = '#cbd5e1';
  let formattedValue = syncedStatus;

  switch (s) {
    case 'NEW':
    case 'INTAKE':
    case 'DOCUMENTS_PENDING':
    case 'PENDING_DOCUMENTS':
    case 'DOCUMENT_COLLECTION':
      bgColor = '#fef3c7';
      color = '#B45309';
      borderColor = '#fde68a';
      formattedValue = 'DOCUMENTS PENDING';
      break;

    case 'DOCUMENTS_VERIFICATION':
    case 'VERIFICATION':
    case 'GOV_VERIFICATION':
    case 'UNDER_REVIEW':
      bgColor = '#eff6ff';
      color = '#1D4ED8';
      borderColor = '#bfdbfe';
      formattedValue = s === 'DOCUMENTS_VERIFICATION' ? 'DOCUMENTS VERIFICATION' : syncedStatus;
      break;

    case 'ACTION_REQUIRED':
    case 'ACTION_NEEDED':
      bgColor = '#fef3c7';
      color = '#B45309';
      borderColor = '#fde68a';
      formattedValue = 'ACTION REQUIRED';
      break;

    case 'SITE_INSPECTION':
      bgColor = '#ffedd5';
      color = '#C2410C';
      borderColor = '#fed7aa';
      formattedValue = 'SITE INSPECTION';
      break;

    case 'SUBMITTED':
      bgColor = '#f3e8ff';
      color = '#7e22ce';
      borderColor = '#e9d5ff';
      formattedValue = 'SUBMITTED';
      break;

    case 'APPROVAL_PENDING':
      bgColor = '#fef08a';
      color = '#A16207';
      borderColor = '#fde047';
      formattedValue = 'APPROVAL PENDING';
      break;

    case 'APPROVED':
    case 'COMPLETED':
    case 'FINALLY_APPROVED':
    case 'FINAL_APPROVAL':
    case 'APPLICATION_COMPLETED':
      bgColor = '#dcfce7';
      color = '#15803d';
      borderColor = '#bbf7d0';
      formattedValue = 'FINALLY APPROVED';
      break;

    case 'REJECTED':
      bgColor = '#fee2e2';
      color = '#b91c1c';
      borderColor = '#fecaca';
      formattedValue = 'REJECTED';
      break;

    default:
      if (s.includes('APPROV') || s.includes('COMPLETE')) {
        bgColor = '#dcfce7';
        color = '#15803d';
        borderColor = '#bbf7d0';
        formattedValue = 'FINALLY APPROVED';
      } else if (s.includes('REJECT')) {
        bgColor = '#fee2e2';
        color = '#b91c1c';
        borderColor = '#fecaca';
        formattedValue = 'REJECTED';
      } else {
        formattedValue = syncedStatus;
      }
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>
        {formattedValue}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
