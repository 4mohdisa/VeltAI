// Stat — a big number with a small uppercase label beneath. Used for streaks,
// XP totals, macro figures. Size maps to the statLarge/Medium/Small tokens.
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type StatProps = {
  value: string | number;
  label: string;
  size?: 'large' | 'medium' | 'small';
  valueColor?: string;
  align?: 'flex-start' | 'center' | 'flex-end';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const variantFor = { large: 'statLarge', medium: 'statMedium', small: 'statSmall' } as const;

export function Stat({
  value,
  label,
  size = 'large',
  valueColor = color.black,
  align = 'flex-start',
  style,
  testID,
}: StatProps) {
  return (
    <View testID={testID} style={[{ alignItems: align, gap: space.xs }, style]}>
      <Text variant={variantFor[size]} color={valueColor}>
        {value}
      </Text>
      <Text
        variant="caption"
        color={color.gray500}
        style={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {label}
      </Text>
    </View>
  );
}
