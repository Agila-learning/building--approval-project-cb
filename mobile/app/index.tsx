import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Direct to login screen as requested (no landing page)
        router.replace('/login');
      } else if (user.role === 'ADMIN') {
        router.replace('/(admin)');
      } else if (user.role === 'CLIENT_READONLY') {
        router.replace('/(customer)');
      } else {
        router.replace('/(employee)');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
});
