// Badge — a small monochrome pill for rank names, status, verification. The
// `tone` prop is kept for API compatibility but every badge renders monochrome
// (grey fill, grey text). Emphasis comes from placement and copy, not colour.
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';

export type BadgeProps = {
  label: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Badge({ label, icon, style, testID }: BadgeProps) {
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
      {icon ? <Icon name={icon} size={13} color={color.gray700} /> : null}
      <Text variant="label" color={color.gray700}>
        {label}
      </Text>
    </View>
  );
}
