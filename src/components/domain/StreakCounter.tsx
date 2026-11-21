// StreakCounter — the hero streak display: animated flame + big number +
// uppercase label. Used on the Profile screen and the streak detail screen.
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StreakFlame } from '@/components/display/StreakFlame';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';

export type StreakCounterProps = {
  days: number;
  active?: boolean;
  caption?: string;
};

export function StreakCounter({ days, active = true, caption }: StreakCounterProps) {
  const { t } = useTranslation();
  const label = caption ?? t('gym.dayStreak', { count: days });
  return (
    <View style={{ alignItems: 'center', gap: space.xs }} accessibilityLabel={`${days} ${label}`}>
      <StreakFlame size={44} active={active && days > 0} />
      <Text variant="statLarge" color={active && days > 0 ? color.label : color.tertiaryLabel}>
        {days}
      </Text>
      <Text variant="caption" color={color.label} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  );
}
