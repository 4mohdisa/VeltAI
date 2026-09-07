// Screen — shared page scaffold so every screen gets consistent safe-area,
// optional NavBar (our chrome), scrolling body, and an optional sticky footer
// for a primary CTA. Keeps the ~50 feature screens uniform and short.
//
// Two chrome variants (see DECISIONS.md "Design-file UI pass"):
//
//   'plain'    (default) white background, a bordered NavBar with a centred
//              title and a back control in the bar. Unchanged — every screen the
//              design file does not cover still renders exactly this.
//   'floating' the design-file treatment: a `surface.backgroundAlt` page, no nav
//              bar at all, a blurred header strip that content scrolls under,
//              a floating glass back button, and the title demoted into the
//              scroll as an uppercase eyebrow over a large title.
//
// Keyboard avoidance stays here for both variants — screens must not roll their
// own (DECISIONS.md, UI conventions).
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavBar } from './NavBar';
import { FloatingHeader, FLOATING_HEADER_HEIGHT } from './FloatingHeader';
import { GlassBackButton } from './GlassButtons';
import { Text } from '@/components/primitives/Text';
import { color, layout, space, surface } from '@/lib/design/tokens';

export type ScreenVariant = 'plain' | 'floating';

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
  /** Chrome treatment. Omit for the original bordered-NavBar look. */
  variant?: ScreenVariant;
  /** 'floating' only: the small uppercase line above the large title. */
  eyebrow?: string;
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
  variant = 'plain',
  eyebrow,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const floating = variant === 'floating';
  const bg = backgroundColor ?? (floating || grouped ? surface.backgroundAlt : color.white);
  const hasHeader = showBack || title !== undefined || headerRight !== undefined;
  // HIG §1.1: keep the home indicator clear. With no footer the last scroll row
  // gets the bottom inset; with a footer the CTA sits above the home indicator.
  const scrollBottom = space['4xl'] + (footer ? 0 : insets.bottom);

  // The floating variant owns its own padding: the scroll starts under the
  // status bar so content passes beneath the blur, and the gutters are narrower
  // than the plain variant's (space.lg, matching the design's 16px).
  //
  // When a floating control is present the content has to START BELOW IT, not
  // beside it — the button floats over the scroll, so an eyebrow and a large
  // title laid out at the same y are simply covered by it. The control sits at
  // insets.top + space.xs and is layout.tapTarget tall, so clearing it costs
  // that height plus a gap.
  const floatingControl = floating && (showBack || headerRight !== undefined);
  const padding = padded
    ? floating
      ? {
          paddingTop: insets.top + (floatingControl ? layout.tapTarget + space.md : space.md),
          paddingHorizontal: space.lg,
        }
      : { padding: space.xl }
    : null;
  const gap = floating ? space.md : space['2xl'];

  const body = (
    <>
      {/* Keyboard avoidance for every form screen: the KAV pads itself by the
          keyboard overlap, keeping the focused field AND the sticky footer CTA
          visible (HIG: no input may hide behind the keyboard). */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={[{ gap, paddingBottom: scrollBottom }, padding, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={!floating}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={color.black} />
              ) : undefined
            }
          >
            {floating && title !== undefined ? (
              <View style={{ gap: space.xs, paddingBottom: space.xs }}>
                {eyebrow ? (
                  <Text
                    variant="label"
                    color={color.secondaryLabel}
                    style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                  >
                    {eyebrow}
                  </Text>
                ) : null}
                <Text variant="title1" color={color.label} accessibilityRole="header">
                  {title}
                </Text>
              </View>
            ) : null}
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
              // The floating look has no rules anywhere; spacing separates the
              // footer instead of a hairline.
              borderTopWidth: floating ? 0 : 1,
              borderTopColor: color.gray200,
            }}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </>
  );

  if (floating) {
    return (
      // No SafeAreaView top edge: the scroll deliberately runs under the status
      // bar so the blur strip has something to blur.
      <View style={{ flex: 1, backgroundColor: bg }}>
        {body}
        <FloatingHeader height={insets.top + space.xl} />
        {showBack ? (
          <View style={{ position: 'absolute', top: insets.top + space.xs, left: space.lg }}>
            <GlassBackButton label={backLabel} />
          </View>
        ) : null}
        {headerRight ? (
          <View style={{ position: 'absolute', top: insets.top + space.xs, right: space.lg }}>{headerRight}</View>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {hasHeader ? (
        <NavBar title={title} showBack={showBack} backLabel={backLabel} right={headerRight} borderless={borderlessHeader} />
      ) : null}
      {body}
    </SafeAreaView>
  );
}

export { FLOATING_HEADER_HEIGHT };
