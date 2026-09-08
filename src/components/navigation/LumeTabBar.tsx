// LumeTabBar — the design file's floating navigation: a glass pill holding
// Summary / Food / Gym, and a separate black "+" beside it that opens the
// AddMenu. It floats over the content rather than sitting in a bar, so screens
// pad themselves past it with TAB_BAR_CLEARANCE.
//
// Why a custom bar at all: NativeTabs renders the system capsule and cannot host
// a JS-drawn bar, so matching the design meant moving to the JS `Tabs` navigator
// (DECISIONS.md, architecture item 1). What that costs is recorded there.
//
// react-navigation contract: a custom tab bar MUST emit `tabPress` (respecting
// preventDefault, which is how "scroll to top / pop to top" behaviours hook in)
// and `tabLongPress`. Navigating without emitting silently breaks them.
import { useState } from 'react';
import { View } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { AddMenu } from './AddMenu';
import { GlassSurface } from './GlassButtons';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, motion, radius, shadow, space, surface, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { haptics } from '@/lib/haptics';

/** The "+" button's diameter — the design's 62pt. No token covers it (the
 *  nearest, layout.buttonHeight, is the 52pt pill height). */
const PLUS_SIZE = 62;

/** The routes this bar draws, in order. `Tabs` auto-injects every file under
 *  (tabs)/ as a route, so the bar renders an explicit allow-list and ignores
 *  anything else rather than growing a cell whenever a file is added. */
const TABS: { name: string; label: string; icon: string }[] = [
  { name: 'index', label: 'Summary', icon: 'chart.bar.fill' },
  { name: 'food', label: 'Food', icon: 'fork.knife' },
  { name: 'gym', label: 'Gym', icon: 'dumbbell.fill' },
];

/** Distance from the screen bottom to the bar's own bottom edge. The design sits
 *  it 22pt up on a home-indicator phone; on a device without one the inset is 0,
 *  so it falls back to a plain margin instead of hugging the edge. */
export function tabBarBottomOffset(insets: EdgeInsets): number {
  return Math.max(insets.bottom - space.md, space.sm);
}

/** What a scrolling tab screen must leave free at the bottom so its last row is
 *  not hidden under the floating bar. */
export function TAB_BAR_CLEARANCE(insets: EdgeInsets): number {
  return tabBarBottomOffset(insets) + PLUS_SIZE + space.lg;
}

export function LumeTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const reduceMotion = useReduceMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const bottom = tabBarBottomOffset(insets);

  const rotation = useDerivedValue(() => {
    const target = menuOpen ? 45 : 0;
    return reduceMotion
      ? target
      : withTiming(target, { duration: motion.duration.fast, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [menuOpen, reduceMotion]);
  const plusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  const focusedRouteName = state.routes[state.index]?.name;

  return (
    <>
      <View
        // The bar itself never animates opacity — that would collapse the glass.
        style={{
          position: 'absolute',
          left: space.lg,
          right: space.lg,
          bottom,
          zIndex: zIndex.fab,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
        }}
      >
        <GlassSurface
          style={{
            flex: 1,
            borderRadius: radius.pill,
            padding: space.xs,
            flexDirection: 'row',
            gap: space.xs,
            ...shadow.md,
          }}
        >
          {TABS.map((tab) => {
            const route = state.routes.find((r) => r.name === tab.name);
            if (!route) return null;
            const isFocused = focusedRouteName === tab.name;
            const options = descriptors[route.key]?.options;

            const onPress = () => {
              // The contract: emit, respect preventDefault, only then navigate.
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                haptic={false}
                minTapTarget={false}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
                style={{
                  flex: 1,
                  minHeight: layout.buttonHeight,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: space.xs,
                  // The selected cell is a quiet chip on the glass, not a fill.
                  backgroundColor: isFocused ? surface.tile : 'transparent',
                }}
              >
                <Icon
                  name={tab.icon}
                  size={space.xl}
                  color={isFocused ? color.label : color.secondaryLabel}
                />
                <Text variant="caption" color={isFocused ? color.label : color.secondaryLabel}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </GlassSurface>

        <Pressable
          onPress={() => {
            haptics.impactLight();
            setMenuOpen((open) => !open);
          }}
          minTapTarget={false}
          haptic={false}
          accessibilityLabel={menuOpen ? 'Close add menu' : 'Add'}
          accessibilityState={{ expanded: menuOpen }}
          accessibilityHint="Log a gym session or log food"
          style={{
            width: PLUS_SIZE,
            height: PLUS_SIZE,
            borderRadius: radius.full,
            backgroundColor: color.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadow.md,
          }}
        >
          <Animated.View style={plusStyle}>
            <Icon name="add" size={space['2xl']} color={color.onPrimary} />
          </Animated.View>
        </Pressable>
      </View>

      <AddMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorBottom={bottom + PLUS_SIZE}
        onLogGym={() => {
          setMenuOpen(false);
          router.push('/gym/log-session');
        }}
        onLogFood={() => {
          setMenuOpen(false);
          router.push('/food/add');
        }}
      />
    </>
  );
}
