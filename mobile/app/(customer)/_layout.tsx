import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobileHeader } from '../../components/MobileHeader';
import { CustomBottomTabBar } from '../../components/CustomBottomTabBar';
import { CustomerMenuDrawer } from '../../components/CustomerMenuDrawer';

export default function CustomerLayout() {
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
          header: () => <MobileHeader title="Citizen Portal" />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Track Status',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload Docs',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cloud-upload-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Customer Menu Drawer - Opened by "More" button */}
      <CustomerMenuDrawer
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
