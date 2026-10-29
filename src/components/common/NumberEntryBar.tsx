// NumberEntryBar — the design's number-entry convention: tapping a value
// docks this slim bar above the native keyboard (eyebrow label, borderless
// autofocused input, "Done" pill). There is no custom keypad anywhere in the
// design. The parent owns which field is being edited and renders the bar only
// while one is; tapping the same value again closes it.
//
// A few values here are raw because the design sets them raw: the 26/32 rounded
// figure, the 14/18 Done pill and its 36pt height, the 2pt label gap and the
// 1.1 label tracking. No type or spacing token covers them.
import { TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, ROUNDED_FACE_BY_WEIGHT, space, surface } from '@/lib/design/tokens';

export type NumberEntryMode = 'numeric' | 'decimal';

export type NumberEntryBarProps = {
  /** Eyebrow copy for the field being edited, e.g. "Calories · kcal". */
  label: string;
  /** Raw entry string — empty shows the "0" placeholder, as in the design. */
  value: string;
  /** Sanitised string plus its parsed number; callers round as their field needs. */
  onChange: (text: string, value: number) => void;
  onDone: () => void;
  mode?: NumberEntryMode;
  maxLength?: number;
};

// The native keyboard feeds the whole string: strip what the mode disallows,
// keep a single decimal group, drop leading zeros, cap the length.
function sanitise(raw: string, mode: NumberEntryMode, maxLength: number): string {
  return raw
    .replace(mode === 'decimal' ? /[^0-9.]/g : /[^0-9]/g, '')
    .replace(/^(\d*\.\d*).*$/, '$1')
    .replace(/^0+(?=\d)/, '')
    .slice(0, maxLength);
}

export function NumberEntryBar({
  label,
  value,
  onChange,
  onDone,
  mode = 'numeric',
  maxLength = 6,
}: NumberEntryBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingTop: space.md,
        paddingHorizontal: space.xl,
        // The design's 34pt bottom pad is the home-indicator inset.
        paddingBottom: insets.bottom || 34,
        backgroundColor: surface.backgroundAlt,
        borderTopWidth: layout.hairline,
        borderTopColor: surface.divider,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          variant="label"
          color={color.secondaryLabel}
          style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}
        >
          {label}
        </Text>
        <TextInput
          autoFocus
          inputMode={mode}
          value={value}
          onChangeText={(raw) => {
            const next = sanitise(raw, mode, maxLength);
            onChange(next, parseFloat(next || '0') || 0);
          }}
          placeholder="0"
          placeholderTextColor={color.tertiaryLabel}
          accessibilityLabel={label}
          style={{
            minHeight: 32,
            padding: 0,
            fontSize: 26,
            fontFamily: ROUNDED_FACE_BY_WEIGHT['600'],
            color: color.label,
          }}
        />
      </View>
      <Pressable
        onPress={onDone}
        minTapTarget={false}
        hitSlop={8}
        style={{
          minHeight: 36,
          paddingHorizontal: space.lg,
          borderRadius: radius.pill,
          backgroundColor: color.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text color={color.onPrimary} style={{ fontSize: 14, lineHeight: 18, fontWeight: '600' }}>
          Done
        </Text>
      </Pressable>
    </View>
  );
}
