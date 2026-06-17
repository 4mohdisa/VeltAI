// Button — monochrome pills. One primary (solid black) per screen.
//   primary     black fill, white text (the one CTA)
//   secondary   transparent, gray300 1px border, black text
//   destructive same as secondary — intent carried by copy + confirmation, not red
//   tertiary    text-only, black label
// Haptic + min target come from the Pressable primitive.
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, layout, radius, space } from '@/lib/design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const fills: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: color.black },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.gray300 },
  tertiary: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.gray300 },
};

const labelColors: Record<ButtonVariant, string> = {
  primary: color.white,
  secondary: color.black,
  tertiary: color.black,
  destructive: color.black,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  icon,
  testID,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const labelColor = labelColors[variant];
  const isBlocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isBlocked}
      haptic={variant === 'primary'}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          borderRadius: radius.pill,
          paddingVertical: space.lg,
          paddingHorizontal: space['2xl'],
          minHeight: layout.buttonHeight,
        },
        fills[variant],
        fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          {/* Weight matches the bodyBold label so icon + text read as one unit. */}
          {icon ? <Icon name={icon} size={18} color={labelColor} weight="semibold" /> : null}
          <Text variant="bodyBold" color={labelColor}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
