import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobileHeader } from '../../components/MobileHeader';
import { CustomBottomTabBar } from '../../components/CustomBottomTabBar';

export default function CustomerLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
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
    </Tabs>
  );
}
