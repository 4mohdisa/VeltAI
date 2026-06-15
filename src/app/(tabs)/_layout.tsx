// Four-tab main app: Dashboard, Food, Gym, Profile.
// Token-themed tab bar (Phase 3 swaps in a fully custom TabBar component if needed).
// Icons: Ionicons, chosen semantically — home for dashboard, restaurant for food,
// barbell for gym, person for profile.
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { color } from '@/lib/design/tokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: IoniconName, unfocused: IoniconName) {
  return ({
    color: c,
    size,
    focused: isFocused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) => <Ionicons name={isFocused ? focused : unfocused} size={size} color={c} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as unknown as BottomTabBarProps)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: color.white },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="food"
        options={{ title: 'Food', tabBarIcon: tabIcon('restaurant', 'restaurant-outline') }}
      />
      <Tabs.Screen
        name="gym"
        options={{ title: 'Gym', tabBarIcon: tabIcon('barbell', 'barbell-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
