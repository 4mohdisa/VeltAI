// Stepper — minus / value / plus for small integer quantities (meals per day,
// daily notification cap, etc.). Buttons disable at the min/max bounds.
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type StepperProps = FieldShellProps & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  testID?: string;
};

export function Stepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  formatValue,
  label,
  helper,
  error,
  required,
  disabled,
  testID,
}: StepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const button = (name: 'remove' | 'add', enabled: boolean, onPress: () => void, a11y: string) => (
    <Pressable
      disabled={!enabled}
      onPress={onPress}
      accessibilityLabel={a11y}
      haptic
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        backgroundColor: color.gray100,
      }}
    >
      <Ionicons name={name} size={20} color={enabled ? color.black : color.gray400} />
    </Pressable>
  );

  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      <View
        testID={testID}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}
      >
        {button('remove', canDecrement, () => onChange(Math.max(min, value - step)), 'Decrease')}
        <Text variant="statSmall" color={color.black} style={{ minWidth: 48, textAlign: 'center' }}>
          {formatValue ? formatValue(value) : String(value)}
        </Text>
        {button('add', canIncrement, () => onChange(Math.min(max, value + step)), 'Increase')}
      </View>
    </FieldShell>
  );
}
