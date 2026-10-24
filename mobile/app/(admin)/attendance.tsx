import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { applicationService } from '../../services/applicationService';
import { AttendanceRecord } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const loadData = async () => {
    try {
      const data = await applicationService.getAttendance();
      setRecords(data);
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

  const handleMarkAttendance = async (type: 'PRESENT' | 'HALF_DAY' | 'LEAVE') => {
    setMarking(true);
    try {
      await applicationService.markAttendance({
        userId: user?.id || user?._id || 'admin',
        userName: user?.name || 'Administrator',
        date: new Date().toISOString().split('T')[0],
        status: type,
        checkInTime: new Date().toLocaleTimeString(),
      });
      Alert.alert('Attendance Marked', `Recorded ${type} for today.`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record attendance');
    } finally {
      setMarking(false);
    }
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const isPresent = item.status === 'PRESENT';
    const isHalfDay = item.status === 'HALF_DAY';

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordLeft}>
          <Text style={styles.userName}>{item.userName || item.userId}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
          {item.checkInTime && (
            <Text style={styles.timeText}>Check-in: {item.checkInTime}</Text>
          )}
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isPresent ? '#DCFCE7' : isHalfDay ? '#FEF9C3' : '#FEE2E2',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: isPresent ? '#15803D' : isHalfDay ? '#A16207' : '#B91C1C',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MobileHeader title="Attendance" />

      {/* Quick Mark Card */}
      <View style={styles.actionCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        <Text style={styles.cardSubtitle}>Mark check-in for {new Date().toDateString()}</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.markBtn, { backgroundColor: colors.success }]}
            onPress={() => handleMarkAttendance('PRESENT')}
            disabled={marking}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Present</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.markBtn, { backgroundColor: colors.gold }]}
            onPress={() => handleMarkAttendance('HALF_DAY')}
            disabled={marking}
          >
            <Ionicons name="time-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Half Day</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.markBtn, { backgroundColor: colors.danger }]}
            onPress={() => handleMarkAttendance('LEAVE')}
            disabled={marking}
          >
            <Ionicons name="close-circle-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.historyHeading}>Recent Attendance Log</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, index) => item.id || String(index)}
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
              <Ionicons name="calendar-outline" size={50} color={colors.textMuted} />
              <Text style={styles.emptyText}>No attendance records found</Text>
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
    backgroundColor: colors.background,
  },
  actionCard: {
    backgroundColor: colors.card,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  markBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  historyHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLeft: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: colors.primary,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
  },
});
