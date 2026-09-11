// SheetContent — the header pattern for every sheet. Two variants:
//
//   'standard' (default, unchanged): GlassCloseButton (X) leading, an optional
//     centred title (title3), GlassSaveButton (tick / Done) trailing when
//     `onDone` is given. Kept for sheets the design does not cover (the parked
//     gym/freeze), which must not be restyled by side effect.
//
//   'leading' (V1, the design's sheets — FoodScreen / GymScreen .dc.html): the
//     title on the LEFT in title3 with an optional footnote subtitle under it,
//     and a 40pt light-1 circle × on the RIGHT. No save button in the header:
//     the design saves with a full-width black pill at the end of the sheet's
//     content ("Save changes", "Add to lunch"), which each screen renders as its
//     last child with <Button />. `onDone` is ignored in this variant.
//
// The native formSheet supplies the grabber + 28px corners; the content
// background is solid WHITE (content is never glass). No back chevron on sheets
// (only when a sheet pushes deeper).
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCloseButton, GlassSaveButton } from './GlassButtons';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, space } from '@/lib/design/tokens';

/** The design's sheet close control: a 40pt circle, 15pt × (FoodScreen.dc.html). */
export const SHEET_CLOSE_SIZE = 40;
export const SHEET_CLOSE_GLYPH = 15;
/** Gap between the title block and the close control, as the design spaces it. */
export const SHEET_HEADER_GAP = 10;

export type SheetVariant = 'standard' | 'leading';

export type SheetContentProps = {
  title?: string;
  /** 'leading' only: a footnote line under the title ("Dots mark days with food logged"). */
  subtitle?: string;
  onClose?: () => void;
  /** 'standard' only: shows the trailing Done/tick button (save-and-dismiss). */
  onDone?: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
  scroll?: boolean;
  variant?: SheetVariant;
  children: ReactNode;
};

function LeadingHeader({ title, subtitle, onClose }: { title?: string; subtitle?: string; onClose?: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SHEET_HEADER_GAP,
        paddingHorizontal: space.xl,
        paddingVertical: space.md,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <Text variant="title3" color={color.label} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="footnote" color={color.secondaryLabel}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onClose}
        haptic={false}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={({ pressed }) => ({
          width: SHEET_CLOSE_SIZE,
          height: SHEET_CLOSE_SIZE,
          borderRadius: radius.full,
          backgroundColor: pressed ? color.light2 : color.light1,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Icon name="close" size={SHEET_CLOSE_GLYPH} color={color.secondaryLabel} />
      </Pressable>
    </View>
  );
}

function StandardHeader({
  title,
  onClose,
  onDone,
  doneLabel,
  doneDisabled,
}: Pick<SheetContentProps, 'title' | 'onClose' | 'onDone' | 'doneLabel' | 'doneDisabled'>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        minHeight: 56,
      }}
    >
      <View style={{ width: layout.tapTarget }}>
        <GlassCloseButton onPress={onClose} />
      </View>
      {title ? (
        <Text variant="title3" color={color.black} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View style={{ width: layout.tapTarget, alignItems: 'flex-end' }}>
        {onDone ? <GlassSaveButton onPress={onDone} disabled={doneDisabled} label={doneLabel} /> : null}
      </View>
    </View>
  );
}

export function SheetContent({
  title,
  subtitle,
  onClose,
  onDone,
  doneLabel,
  doneDisabled,
  scroll = true,
  variant = 'standard',
  children,
}: SheetContentProps) {
  const leading = variant === 'leading';
  // The design's sheet body: 20pt sides, the header's own 12pt bottom padding
  // above it, 20pt between blocks. The standard body is unchanged.
  const body = leading
    ? { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.xl }
    : { padding: space.xl, gap: space['2xl'], paddingBottom: space['3xl'] };

  return (
    // accessibilityViewIsModal traps VoiceOver focus inside the sheet (HIG §7.1) so
    // rotor/swipe can't wander to the dimmed content behind it.
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['bottom']} accessibilityViewIsModal>
      {leading ? (
        <LeadingHeader title={title} subtitle={subtitle} onClose={onClose} />
      ) : (
        <StandardHeader title={title} onClose={onClose} onDone={onDone} doneLabel={doneLabel} doneDisabled={doneDisabled} />
      )}

      {/* Keyboard avoidance: fields low in the sheet (e.g. log-session Notes)
          must not hide behind the keyboard. The 'leading' variant's save pill is
          the last child of the scroll, so it scrolls into reach above the
          keyboard with the rest of the content. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={body}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, body]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
