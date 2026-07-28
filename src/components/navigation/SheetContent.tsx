// SheetContent — the ONE header pattern for every create/edit sheet:
//   Leading (left):  GlassCloseButton (X) — dismiss without saving.
//   Trailing (right): GlassSaveButton (tick / Done) — save and dismiss.
//   Optional centred title (title3).
// The native formSheet supplies the grabber + 28px corners; the content
// background is solid WHITE (content is never glass). No back chevron on sheets
// (only when a sheet pushes deeper).
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCloseButton, GlassSaveButton } from './GlassButtons';
import { Text } from '@/components/primitives/Text';
import { color, layout, space } from '@/lib/design/tokens';

export type SheetContentProps = {
  title?: string;
  onClose?: () => void;
  /** Provide to show the trailing Done/tick button (save-and-dismiss). */
  onDone?: () => void;
  doneLabel?: string;
  doneDisabled?: boolean;
  scroll?: boolean;
  children: ReactNode;
};

export function SheetContent({
  title,
  onClose,
  onDone,
  doneLabel,
  doneDisabled,
  scroll = true,
  children,
}: SheetContentProps) {
  return (
    // accessibilityViewIsModal traps VoiceOver focus inside the sheet (HIG §7.1) so
    // rotor/swipe can't wander to the dimmed content behind it.
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }} edges={['bottom']} accessibilityViewIsModal>
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

      {/* Keyboard avoidance: fields low in the sheet (e.g. log-session Notes)
          must not hide behind the keyboard. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ padding: space.xl, gap: space['2xl'], paddingBottom: space['3xl'] }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: space.xl, gap: space['2xl'] }}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
