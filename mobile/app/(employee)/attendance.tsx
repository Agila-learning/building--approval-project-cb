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
import { applicationService } from '../../services/applicationService';
import { AttendanceRecord } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function EmployeeAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const loadData = async () => {
    try {
      const data = await applicationService.getAttendance();
      // Filter records for this employee if logged in
      const myRecords = data.filter(
        (r) =>
          !user ||
          (r.name && user.name && r.name.toLowerCase() === user.name.toLowerCase()) ||
          (r.id && (user.id || user.staffId) && (r.id === user.id || r.id === user.staffId))
      );
      setRecords(myRecords.length > 0 ? myRecords : data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find((r) => r.date === todayStr);

  const handleMarkAttendance = async (type: 'PRESENT' | 'HALF_DAY' | 'LEAVE') => {
    setMarking(true);
    try {
      const timeString = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      await applicationService.markAttendance({
        id: user?.staffId || user?.id || `EMP-${(user?.name || 'Staff').replace(/\s+/g, '')}`,
        name: user?.name || 'Staff Member',
        role: user?.role || 'Staff Member',
        date: todayStr,
        status: type === 'LEAVE' ? 'Leave' : type === 'HALF_DAY' ? 'Half Day' : 'Present',
        type: type === 'PRESENT' ? 'checkIn' : type,
        checkIn: timeString,
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
    const statusUpper = (item.status || '').toUpperCase();
    const isPresent = statusUpper.includes('PRESENT');
    const isHalfDay = statusUpper.includes('HALF');

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordLeft}>
          <Text style={styles.userName}>{item.name || item.userName || 'Attendance'}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
          {(item.checkIn || item.checkInTime) && (
            <Text style={styles.timeText}>Check-in: {item.checkIn || item.checkInTime}</Text>
          )}
          {item.checkOut && item.checkOut !== '--' && (
            <Text style={styles.timeText}>Check-out: {item.checkOut}</Text>
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
      {/* Check-in card for employee */}
      <View style={styles.actionCard}>
        <Text style={styles.cardTitle}>Daily Attendance Check-in</Text>
        <Text style={styles.cardSubtitle}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>

        {todayRecord ? (
          <View style={styles.markedBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.markedTitle}>Today's Status: {todayRecord.status}</Text>
              <Text style={styles.markedSub}>
                Check-in time: {todayRecord.checkIn || todayRecord.checkInTime || 'Recorded'}
              </Text>
            </View>
          </View>
        ) : (
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
        )}
      </View>

      <Text style={styles.historyHeading}>My Attendance History</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, index) => item.id || `${item.date}_${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom + 80, 96) },
          ]}
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
  markedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: borderRadius.sm,
  },
  markedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  markedSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
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
