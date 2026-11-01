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
import { useState, type JSX } from 'react';
import { View } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AddMenu } from './AddMenu';
import { GlassSurface } from './GlassButtons';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, motion, radius, shadow, space, zIndex } from '@/lib/design/tokens';
import { useReduceMotion } from '@/lib/design/reduceMotion';
import { haptics } from '@/lib/haptics';

/** The "+" button's diameter — the design's 62pt. No token covers it (the
 *  nearest, layout.buttonHeight, is the 52pt pill height). */
const PLUS_SIZE = 62;

/** The design's own values for the bar. No token covers them. */
const BAR_BOTTOM = 22;
const BAR_GAP = 10;
const PILL_PADDING = 5;
const CELL_GAP = 2;
const CELL_CONTENT_GAP = 2;
const CELL_PRESSED_OPACITY = 0.55;
const ACTIVE_CELL_FILL = 'rgba(0, 0, 0, 0.055)';
const GLYPH_SIZE = 21;
const PLUS_GLYPH_SIZE = 27;
const PLUS_GLYPH_STROKE = 2.6;
const PLUS_PRESSED_OPACITY = 0.86;
const PLUS_PRESSED_SCALE = 0.96;
const PLUS_RING_WIDTH = 0.5;
const PLUS_RING = 'rgba(255, 255, 255, 0.14)';
const PLUS_SHADOW = { ...shadow.md, shadowOpacity: 0.26, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } };

type GlyphProps = { tint: string };

function SummaryGlyph({ tint }: GlyphProps) {
  return (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24">
      <G fill={tint}>
        <Rect x={3} y={11} width={4} height={10} rx={1.8} />
        <Rect x={10} y={6} width={4} height={15} rx={1.8} />
        <Rect x={17} y={3} width={4} height={18} rx={1.8} />
      </G>
    </Svg>
  );
}

function FoodGlyph({ tint }: GlyphProps) {
  return (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24">
      <Path fill={tint} d="M3 12.5a9 9 0 0018 0z" />
      <Path
        d="M8.5 8.5c0-1.4 1-1.6 1-3M12.5 8.5c0-1.4 1-1.6 1-3M16.5 8.5c0-1.4 1-1.6 1-3"
        fill="none"
        stroke={tint}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GymGlyph({ tint }: GlyphProps) {
  return (
    <Svg width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 24 24">
      <G fill={tint}>
        <Rect x={3} y={7} width={3.4} height={10} rx={1.7} />
        <Rect x={17.6} y={7} width={3.4} height={10} rx={1.7} />
        <Rect x={0.5} y={9.2} width={2} height={5.6} rx={1} />
        <Rect x={21.5} y={9.2} width={2} height={5.6} rx={1} />
        <Rect x={6.4} y={10.6} width={11.2} height={2.8} rx={1.4} />
      </G>
    </Svg>
  );
}

/** The routes this bar draws, in order. `Tabs` auto-injects every file under
 *  (tabs)/ as a route, so the bar renders an explicit allow-list and ignores
 *  anything else rather than growing a cell whenever a file is added. */
const TABS: { name: string; labelKey: string; Glyph: (props: GlyphProps) => JSX.Element }[] = [
  { name: 'index', labelKey: 'dashboard.summaryTitle', Glyph: SummaryGlyph },
  { name: 'food', labelKey: 'food.title', Glyph: FoodGlyph },
  { name: 'gym', labelKey: 'gym.title', Glyph: GymGlyph },
];

/** Distance from the screen bottom to the bar's own bottom edge: the design's
 *  fixed 22pt, raised only if a device's inset would otherwise crowd the bar. */
export function tabBarBottomOffset(insets: EdgeInsets): number {
  return Math.max(insets.bottom - space.md, BAR_BOTTOM);
}

/** What a scrolling tab screen must leave free at the bottom so its last row is
 *  not hidden under the floating bar. */
export function TAB_BAR_CLEARANCE(insets: EdgeInsets): number {
  return tabBarBottomOffset(insets) + PLUS_SIZE + space.lg;
}

export function LumeTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation();
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
          gap: BAR_GAP,
        }}
      >
        <GlassSurface
          style={{
            flex: 1,
            borderRadius: radius.pill,
            padding: PILL_PADDING,
            flexDirection: 'row',
            gap: CELL_GAP,
            ...shadow.md,
          }}
        >
          {TABS.map((tab) => {
            const route = state.routes.find((r) => r.name === tab.name);
            if (!route) return null;
            const isFocused = focusedRouteName === tab.name;
            const options = descriptors[route.key]?.options;
            const label = t(tab.labelKey);

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
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: layout.buttonHeight,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: CELL_CONTENT_GAP,
                  // The selected cell is a quiet chip on the glass, not a fill.
                  backgroundColor: isFocused ? ACTIVE_CELL_FILL : 'transparent',
                  opacity: pressed && !isFocused ? CELL_PRESSED_OPACITY : 1,
                })}
              >
                <tab.Glyph tint={isFocused ? color.label : color.secondaryLabel} />
                <Text
                  variant="caption"
                  color={isFocused ? color.label : color.secondaryLabel}
                  style={isFocused ? { fontWeight: '600' } : undefined}
                >
                  {label}
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
          accessibilityLabel={menuOpen ? t('tabBar.closeAddMenu') : t('tabBar.add')}
          accessibilityState={{ expanded: menuOpen }}
          accessibilityHint={t('tabBar.addHint')}
          style={({ pressed }) => ({
            width: PLUS_SIZE,
            height: PLUS_SIZE,
            borderRadius: radius.full,
            backgroundColor: color.primary,
            borderWidth: PLUS_RING_WIDTH,
            borderColor: PLUS_RING,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? PLUS_PRESSED_OPACITY : 1,
            transform: [{ scale: pressed ? PLUS_PRESSED_SCALE : 1 }],
            ...PLUS_SHADOW,
          })}
        >
          <Animated.View style={plusStyle}>
            <Svg width={PLUS_GLYPH_SIZE} height={PLUS_GLYPH_SIZE} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke={color.onPrimary} strokeWidth={PLUS_GLYPH_STROKE} strokeLinecap="round" />
            </Svg>
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
