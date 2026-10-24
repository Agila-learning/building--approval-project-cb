import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

interface StatusBadgeProps {
  status?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'PENDING' }) => {
  const rawStatus = (status || 'PENDING').toUpperCase();
  const displayStatus = rawStatus === 'INTAKE' ? 'DOCUMENTS PENDING' : (status ? status.replace(/_/g, ' ') : 'PENDING');

  const getStyle = () => {
    const s = displayStatus.toUpperCase();
    if (s.includes('APPROV') || s.includes('COMPLETE')) {
      return { bg: '#EBF6EE', text: Colors.successGreen, border: '#CBE5D3' };
    }
    if (s.includes('REJECT') || s.includes('FAILED')) {
      return { bg: '#FDECEC', text: Colors.errorRed, border: '#F8B4B4' };
    }
    if (s.includes('VERIF') || s.includes('REVIEW') || s.includes('SUBMIT')) {
      return { bg: '#EBF1FF', text: Colors.primary, border: '#C7D8FD' };
    }
    return { bg: '#FEF6E9', text: Colors.warningGold, border: '#FBE4B8' };
  };

  const style = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>
        {displayStatus}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
