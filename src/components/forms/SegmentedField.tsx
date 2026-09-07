// SegmentedField — monochrome single-select segmented control. One choice at a
// time, in two looks (see DECISIONS.md "Design-file UI pass"):
//
//   'solid' (default) grey pill track; the selected segment fills solid black
//           with white text. Unchanged — onboarding and every screen the design
//           file does not cover still renders this.
//   'inset' the design-file look: a darker `light2` track with the selected
//           segment lifted out in WHITE + shadow.sm and near-black text. Reads
//           as a raised chip rather than a stamped one, which is what lets it
//           sit on an elevated white card without fighting it.
import { View } from 'react-native';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, shadow, space, surface } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';

export type SegmentedOption<T extends string> = { label: string; value: T };

export type SegmentedVariant = 'solid' | 'inset';

export type SegmentedFieldProps<T extends string> = FieldShellProps & {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Track/selection treatment. Omit for the original black-on-grey look. */
  variant?: SegmentedVariant;
  testID?: string;
};

export function SegmentedField<T extends string>({
  options,
  value,
  onChange,
  label,
  helper,
  error,
  required,
  disabled,
  variant = 'solid',
  testID,
}: SegmentedFieldProps<T>) {
  const inset = variant === 'inset';
  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      <View
        testID={testID}
        style={{
          flexDirection: 'row',
          backgroundColor: inset ? color.light2 : surface.card,
          borderRadius: radius.pill,
          padding: space.xs,
          gap: space.xs,
        }}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              disabled={disabled}
              minTapTarget={false}
              haptic={false}
              onPress={() => {
                if (!selected) haptics.selection(); // selection tick (HIG §9)
                onChange(opt.value);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              style={[
                {
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: space.md,
                  paddingHorizontal: space.sm, // keep the label off the rounded edge
                  borderRadius: radius.pill,
                  minHeight: layout.tapTarget,
                },
                selected
                  ? inset
                    ? { backgroundColor: color.white, ...shadow.sm }
                    : { backgroundColor: color.black }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              {/* Scale a long label down to one line so it never bleeds past the
                  pill; short labels (Metric, Grams, kg…) stay at full size. */}
              <Text
                variant="bodyMedium"
                color={selected ? (inset ? color.label : color.white) : color.secondaryLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={{ textAlign: 'center' }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}
