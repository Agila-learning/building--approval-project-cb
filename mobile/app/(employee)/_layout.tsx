import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobileHeader } from '../../components/MobileHeader';
import { CustomBottomTabBar } from '../../components/CustomBottomTabBar';
import { HamburgerMenuDrawer } from '../../components/HamburgerMenuDrawer';

export default function EmployeeLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => (
          <CustomBottomTabBar
            {...props}
            onOpenMenu={() => setMenuOpen(true)}
            isMenuOpen={menuOpen}
          />
        )}
        screenOptions={{
          header: () => <MobileHeader title="Employee Portal" />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'My Tasks',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="folder-open-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <HamburgerMenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
