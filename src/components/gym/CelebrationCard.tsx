// CelebrationCard — the design's post-log confirmation: a streak hero, the
// session's Time / Calories / Volume and a black "Nice one" pill. Presentational
// only: the parent supplies the formatted values, the other copy and the modal around it.
//
// A few values here are raw because the design sets them raw: the 262pt card
// width and the 88/64/30 ring, disc and flame sizes. No token covers them.
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Stat } from '@/components/display';
import { StreakFlame } from '@/components/display/StreakFlame';
import { mixHex } from '@/components/domain/GymCalendar';
import { Button } from '@/components/forms';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, layout, radius, shadow, space } from '@/lib/design/tokens';

type CelebrationCardProps = {
  streakDays: number;
  time: string;
  calories: string;
  volume: string;
  timeLabel: string;
  caloriesLabel: string;
  volumeLabel: string;
  nicePillLabel: string;
  onNice: () => void;
};

export function CelebrationCard({
  streakDays,
  time,
  calories,
  volume,
  timeLabel,
  caloriesLabel,
  volumeLabel,
  nicePillLabel,
  onNice,
}: CelebrationCardProps): JSX.Element {
  const { t } = useTranslation();
  const streakLabel = t('gymLog.celebration.streak', { count: streakDays });

  return (
    <Card
      variant="elevated"
      padded={false}
      style={{ width: 262, padding: space['2xl'], alignItems: 'center', gap: space.lg, ...shadow.lg }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          backgroundColor: mixHex(categoryAccent.streak, color.white, 0.18),
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.full,
            backgroundColor: mixHex(categoryAccent.streak, color.white, 0.14),
          }}
        >
          <StreakFlame size={30} />
        </View>
      </View>

      <View accessible accessibilityLabel={`${streakDays} ${streakLabel}`} style={{ alignItems: 'center', gap: space.xs }}>
        <Text variant="statHero" color={color.label}>
          {streakDays}
        </Text>
        <Text variant="callout" color={color.label}>
          {streakLabel}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'center', gap: space.lg }}>
        <Stat value={time} label={timeLabel} size="small" align="center" valueColor={color.label} />
        <Stat value={calories} label={caloriesLabel} size="small" align="center" valueColor={categoryAccent.calories} />
        <Stat value={volume} label={volumeLabel} size="small" align="center" valueColor={color.label} />
      </View>

      <Button
        title={nicePillLabel}
        onPress={onNice}
        style={{ minHeight: layout.tapTarget, paddingVertical: space.sm }}
      />
    </Card>
  );
}
