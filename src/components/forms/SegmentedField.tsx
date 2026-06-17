// SegmentedField — monochrome single-select segmented control. Grey pill track;
// the selected segment fills solid black with white text. One choice at a time.
import { View } from 'react-native';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, space, surface } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';

export type SegmentedOption<T extends string> = { label: string; value: T };

export type SegmentedFieldProps<T extends string> = FieldShellProps & {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
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
  testID,
}: SegmentedFieldProps<T>) {
  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      <View
        testID={testID}
        style={{
          flexDirection: 'row',
          backgroundColor: surface.card,
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
                  borderRadius: radius.pill,
                  minHeight: layout.tapTarget,
                },
                selected ? { backgroundColor: color.black } : { backgroundColor: 'transparent' },
              ]}
            >
              <Text variant="bodyMedium" color={selected ? color.white : color.gray600}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}
