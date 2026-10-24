import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, showBack = false, rightAction }) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={22} color={Colors.bgSurface} />
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../assets/logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {user && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {user.name} ({user.role})
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightRow}>
          {rightAction}
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color={Colors.bgSurface} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.primaryDark,
  },
  container: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginRight: 10,
  },
  iconButton: {
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.bgSurface,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.bgSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
