// Stepper — minus / value / plus for small integer quantities (meals per day,
// daily notification cap, etc.). Buttons disable at the min/max bounds.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { FieldShell, type FieldShellProps } from './FieldShell';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, space } from '@/lib/design/tokens';

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
        width: layout.tapTarget,
        height: layout.tapTarget,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        backgroundColor: color.gray100,
      }}
    >
      <Icon name={name} size={20} color={enabled ? color.black : color.gray400} />
    </Pressable>
  );

  const valueText = formatValue ? formatValue(value) : String(value);

  return (
    <FieldShell label={label} helper={helper} error={error} required={required} disabled={disabled}>
      {/* One `adjustable` element (HIG §7.1): VoiceOver swipe up/down increments /
          decrements and announces the new value; the +/- buttons remain for touch. */}
      <View
        testID={testID}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: valueText }}
        accessibilityState={{ disabled: !!disabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && canIncrement) onChange(Math.min(max, value + step));
          else if (e.nativeEvent.actionName === 'decrement' && canDecrement) onChange(Math.max(min, value - step));
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}
      >
        {button('remove', canDecrement, () => onChange(Math.max(min, value - step)), 'Decrease')}
        <Text variant="statSmall" color={color.black} style={{ minWidth: 48, textAlign: 'center' }}>
          {valueText}
        </Text>
        {button('add', canIncrement, () => onChange(Math.min(max, value + step)), 'Increase')}
      </View>
    </FieldShell>
  );
}
