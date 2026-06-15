// Button — four variants from the tokens doc's component shorthand:
//   primary     accent fill, white text (the one CTA per screen)
//   secondary   white fill, black border
//   tertiary    text-only, accent label
//   destructive white fill, error border + error label
// Haptic + 44pt min target come from the Pressable primitive.
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const fills: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: color.accent },
  secondary: { backgroundColor: color.white, borderWidth: 1, borderColor: color.black },
  tertiary: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: color.white, borderWidth: 1, borderColor: color.error },
};

const labelColors: Record<ButtonVariant, string> = {
  primary: color.white,
  secondary: color.black,
  tertiary: color.accentText,
  destructive: color.error,
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
          borderRadius: radius.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
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
          {icon ? <Ionicons name={icon} size={18} color={labelColor} /> : null}
          <Text variant="bodyBold" color={labelColor}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
