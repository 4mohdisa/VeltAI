// MultiSelectField — wrapping row of selectable chips. Selected chips fill with
// the accent-light background + accent border; a check icon confirms state.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type ChipOption = { label: string; value: string };

export type MultiSelectFieldProps = FieldShellProps & {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  testID?: string;
};

export function MultiSelectField({
  options,
  selected,
  onChange,
  label,
  helper,
  error,
  required,
  disabled,
  testID,
}: MultiSelectFieldProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      <View testID={testID} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              disabled={disabled}
              minTapTarget={false}
              haptic={false}
              onPress={() => toggle(opt.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={opt.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.xs,
                paddingVertical: space.sm,
                paddingHorizontal: space.md,
                borderRadius: radius.full,
                borderWidth: 1,
                minHeight: 40,
                backgroundColor: isSelected ? color.accentLight : color.white,
                borderColor: isSelected ? color.accentBorder : color.gray200,
              }}
            >
              {isSelected ? (
                <Icon name="checkmark-circle" size={16} color={color.accentText} />
              ) : null}
              <Text variant="callout" color={isSelected ? color.accentText : color.gray900}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}
