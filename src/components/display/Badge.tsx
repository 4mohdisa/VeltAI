// Badge — a small monochrome pill for status / neutral labels (e.g. AI, plan). Fill and
// text stay monochrome; the optional `iconColor` lets a FUNCTIONAL badge (e.g.
// the AI badge) tint only its small icon with an accent — the surface never
// gets colour.
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';

export type BadgeProps = {
  label: string;
  icon?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Badge({ label, icon, iconColor = color.label, style, testID }: BadgeProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.xs,
          alignSelf: 'flex-start',
          backgroundColor: surface.card,
          borderRadius: radius.pill,
          paddingVertical: space.xs,
          paddingHorizontal: space.md,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={13} color={iconColor} /> : null}
      <Text variant="label" color={color.label}>
        {label}
      </Text>
    </View>
  );
}
