// GymSessionButton — the primary "Log gym session" CTA, or a logged-confirmation
// pill once today's session exists. The single most important action in Lume.
import { View } from 'react-native';

import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';

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
          backgroundColor: surface.tile,
          borderRadius: radius.pill,
          paddingVertical: space.lg,
          minHeight: layout.buttonHeight,
        }}
      >
        {/* The design's "logged" state is a dot, not a glyph — the positive
            accent is the one colour, on the smallest possible mark. */}
        <View
          style={{ width: space.sm, height: space.sm, borderRadius: radius.full, backgroundColor: categoryAccent.positive }}
        />
        <Text variant="bodyMedium" color={color.label}>
          Logged today
        </Text>
      </View>
    );
  }

  return <Button title="Log gym session" icon="barbell" onPress={onPress} accessibilityLabel="Log gym session" />;
}
