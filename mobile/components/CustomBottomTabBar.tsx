import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

const PRIMARY_TABS = ['index', 'applications', 'customers', 'staff'];

interface CustomBottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onOpenMenu?: () => void;
  isMenuOpen?: boolean;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onOpenMenu,
  isMenuOpen = false,
}) => {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  // Filter primary tabs per portal
  const isCustomerTabs = state.routes.some((route: any) => route.name === 'upload');
  const isEmployeeTabs = state.routes.some((route: any) => route.name === 'attendance');

  let allowedTabs = PRIMARY_TABS;
  if (isCustomerTabs) {
    allowedTabs = ['index', 'upload'];
  } else if (isEmployeeTabs) {
    allowedTabs = ['index', 'applications', 'attendance'];
  }

  const primaryRoutes = state.routes.filter((route: any) =>
    allowedTabs.includes(route.name)
  );

  // Check if current active route is a primary tab
  const activeRouteName = state.routes[state.index]?.name;
  const isSubRouteActive = !allowedTabs.includes(activeRouteName);

  return (
    <View
      style={[
        styles.barContainer,
        {
          paddingBottom: isWeb ? 10 : Math.max(insets.bottom, 10),
          height: isWeb ? 66 : 64 + Math.max(insets.bottom, 8),
        },
      ]}
    >
      {/* 4 Primary Navigation Items */}
      {primaryRoutes.map((route: any) => {
        const index = state.routes.indexOf(route);
        const { options } = descriptors[route.key] || {};
        const isFocused = state.index === index && !isMenuOpen;

        let label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        if (typeof label === 'function') {
          label = options.title || route.name;
        }

        const activeColor = Colors.primary;
        const inactiveColor = '#64748B';
        const currentColor = isFocused ? activeColor : inactiveColor;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: currentColor,
                size: 24,
              })}
            </View>

            <Text
              style={[
                styles.tabLabel,
                {
                  color: currentColor,
                  fontWeight: isFocused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {typeof label === 'string' ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* 5th Navigation Item: More (Hamburger Drawer trigger or More Screen) */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="More Options"
        onPress={() => {
          if (onOpenMenu) {
            onOpenMenu();
          }
          const hasMoreScreen = state.routes.some((r: any) => r.name === 'more');
          if (hasMoreScreen) {
            navigation.navigate('more');
          }
        }}
        activeOpacity={0.7}
        style={styles.tabItem}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={isMenuOpen ? 'close-outline' : 'menu-outline'}
            size={24}
            color={isMenuOpen || isSubRouteActive ? Colors.primary : '#64748B'}
          />
        </View>

        <Text
          style={[
            styles.tabLabel,
            {
              color: isMenuOpen || isSubRouteActive ? Colors.primary : '#64748B',
              fontWeight: isMenuOpen || isSubRouteActive ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          More
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 999,
  },
  tabItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.1,
  },
});
