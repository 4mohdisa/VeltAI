// GymSessionButton — the primary "Log gym session" CTA, or a logged-confirmation
// pill once today's session exists. The single most important action in Lume.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type GymSessionButtonProps = {
  logged: boolean;
  onPress: () => void;
};

export function GymSessionButton({ logged, onPress }: GymSessionButtonProps) {
  if (logged) {
    return (
      <View
        accessibilityLabel="Gym logged today"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          backgroundColor: color.gray100,
          borderRadius: radius.pill,
          paddingVertical: space.lg,
          minHeight: 52,
        }}
      >
        <Icon name="checkmark-circle" size={20} color={color.black} />
        <Text variant="bodyBold" color={color.black}>
          Logged today
        </Text>
      </View>
    );
  }

  return <Button title="Log gym session" icon="barbell" onPress={onPress} accessibilityLabel="Log gym session" />;
}
