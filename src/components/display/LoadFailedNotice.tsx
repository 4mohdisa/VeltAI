// One honest line for "this read failed".
//
// useHydration reports a real error now, but the fetch layer has no user-facing
// reason to offer — so nothing here invents one. The copy states only what is
// true (we could not load the latest) and offers the only useful action. Screens
// place it ABOVE whatever the device already had, so local data stays visible and
// is labelled rather than presented as current.
import { View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { color, radius, space, surface } from '@/lib/design/tokens';

export type LoadFailedNoticeProps = {
  /** Names WHAT failed ("Couldn't load your streak."). Never a reason — the
   *  fetch layer does not supply one. */
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
};

export function LoadFailedNotice({ message, onRetry, style }: LoadFailedNoticeProps) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingVertical: space.sm,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          backgroundColor: surface.tile,
        },
        style,
      ]}
    >
      <Icon name="alert-circle-outline" size={16} color={color.secondaryLabel} />
      <Text variant="footnote" color={color.secondaryLabel} style={{ flex: 1 }}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} haptic={false} minTapTarget={false} accessibilityRole="button" accessibilityLabel={t('common.tryAgain')}>
          <Text variant="footnote" color={color.label}>
            {t('common.tryAgain')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
