// CustomTabBar — token-themed bottom tab bar for the four main tabs. Plugged
// into expo-router's Tabs via the `tabBar` prop so styling is fully ours.
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: color.white,
        borderTopWidth: 1,
        borderTopColor: color.gray200,
        paddingBottom: insets.bottom,
        paddingTop: space.sm,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const tint = focused ? color.accent : color.gray500;
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            haptic={false}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingVertical: space.xs }}
          >
            {options.tabBarIcon
              ? options.tabBarIcon({ focused, color: tint, size: 24 })
              : null}
            <Text variant="caption" color={tint}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
