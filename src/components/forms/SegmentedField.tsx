// SegmentedField — iOS-style single-select segmented control. Track is a gray
// pill; the selected segment lifts to a white card. One choice at a time.
import { View } from 'react-native';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, shadow } from '@/lib/design/tokens';

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
          backgroundColor: color.gray100,
          borderRadius: radius.md,
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
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              style={[
                {
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: space.sm,
                  borderRadius: radius.sm,
                  minHeight: 36,
                },
                selected
                  ? { backgroundColor: color.white, ...shadow.sm }
                  : { backgroundColor: 'transparent' },
              ]}
            >
              <Text variant={selected ? 'bodyBold' : 'body'} color={selected ? color.black : color.gray700}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}
