import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomBottomTabBar } from '../../components/CustomBottomTabBar';
import { HamburgerMenuDrawer } from '../../components/HamburgerMenuDrawer';

export default function AdminLayout() {
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
          headerShown: false,
        }}
      >
        {/* Primary Tab 1: Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Primary Tab 2: Applications */}
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Primary Tab 3: Customers */}
        <Tabs.Screen
          name="customers"
          options={{
            title: 'Customers',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Primary Tab 4: Staff */}
        <Tabs.Screen
          name="staff"
          options={{
            title: 'Staff',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Secondary Modules (Hidden from bottom tab bar, accessible via Hamburger Menu & Quick Actions) */}
        <Tabs.Screen
          name="reports"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="new-application"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="application-detail"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="attendance"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="link-tracking"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Slide-in Hamburger Menu Drawer */}
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
