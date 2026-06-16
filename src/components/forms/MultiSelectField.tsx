// MultiSelectField — wrapping row of selectable pill chips. Unselected = grey
// fill + grey text; selected = solid black + white text (the Cal AI chip motif).
// Monochrome, no borders.
import { View } from 'react-native';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';

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
                paddingVertical: space.md,
                paddingHorizontal: space.xl,
                borderRadius: radius.pill,
                minHeight: 44,
                justifyContent: 'center',
                backgroundColor: isSelected ? color.black : surface.card,
              }}
            >
              <Text variant="bodyMedium" color={isSelected ? color.white : color.gray700}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}
