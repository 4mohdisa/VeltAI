// GymSessionButton — the primary "Log this session" CTA, or a logged-confirmation
// pill once today's session exists. The single most important action in Lume.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, layout, opacity, radius, space, surface } from '@/lib/design/tokens';
import { haptics } from '@/lib/haptics';

export type GymSessionButtonProps = {
  logged: boolean;
  onPress: () => void;
};

export function GymSessionButton({ logged, onPress }: GymSessionButtonProps) {
  const { t } = useTranslation();

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

  // Button only takes a leading icon; the design's chevron trails the label.
  return (
    <Pressable
      haptic={false}
      onPress={() => {
        haptics.impactMedium();
        onPress();
      }}
      accessibilityLabel={t('gym.logThisSession')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        backgroundColor: color.primary,
        borderRadius: radius.pill,
        paddingVertical: space.lg,
        paddingHorizontal: space['2xl'],
        minHeight: layout.buttonHeight,
      }}
    >
      <Text variant="bodyBold" color={color.onPrimary}>
        {t('gym.logThisSession')}
      </Text>
      <Icon name="chevron-up" size={15} color={color.onPrimary} weight="semibold" style={{ opacity: opacity.medium }} />
    </Pressable>
  );
}
