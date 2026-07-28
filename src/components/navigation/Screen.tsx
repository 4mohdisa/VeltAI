// Screen — shared page scaffold so every screen gets consistent safe-area,
// optional NavBar (our chrome), scrolling body, and an optional sticky footer
// for a primary CTA. Keeps the ~50 feature screens uniform and short.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavBar } from './NavBar';
import { color, space, surface } from '@/lib/design/tokens';

export type ScreenProps = {
  title?: string;
  showBack?: boolean;
  /** Names the previous screen on the back control (HIG §4.2). */
  backLabel?: string;
  headerRight?: ReactNode;
  borderlessHeader?: boolean;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  /** Inset-grouped settings look: subtle grouped background (HIG §6.2). */
  grouped?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  title,
  showBack = false,
  backLabel,
  headerRight,
  borderlessHeader,
  scroll = true,
  padded = true,
  footer,
  children,
  contentStyle,
  backgroundColor,
  grouped = false,
  refreshing,
  onRefresh,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bg = backgroundColor ?? (grouped ? surface.backgroundAlt : color.white);
  const hasHeader = showBack || title !== undefined || headerRight !== undefined;
  const padding = padded ? { padding: space.xl } : null;
  // HIG §1.1: keep the home indicator clear. With no footer the last scroll row
  // gets the bottom inset; with a footer the CTA sits above the home indicator.
  const scrollBottom = space['4xl'] + (footer ? 0 : insets.bottom);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {hasHeader ? (
        <NavBar title={title} showBack={showBack} backLabel={backLabel} right={headerRight} borderless={borderlessHeader} />
      ) : null}

      {/* Keyboard avoidance for every form screen: the KAV pads itself by the
          keyboard overlap, keeping the focused field AND the sticky footer CTA
          visible (HIG: no input may hide behind the keyboard). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={[{ gap: space['2xl'], paddingBottom: scrollBottom }, padding, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.black} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, gap: space.lg }, padding, contentStyle]}>{children}</View>
        )}

        {footer ? (
          <View
            style={{
              paddingHorizontal: space.lg,
              paddingTop: space.lg,
              paddingBottom: space.lg + insets.bottom,
              borderTopWidth: 1,
              borderTopColor: color.gray200,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
