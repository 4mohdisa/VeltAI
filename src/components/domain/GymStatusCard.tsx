// GymStatusCard — the Dashboard's middle hero. Not logged → a big primary
// "Log gym session" CTA. Logged → a confirmation row with the duration. Logging
// updates the streak only (no XP, no verification reward). The single most
// important action in the app.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { categoryAccent, color, layout, radius, space, surface } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';

export type GymStatusCardProps = {
  logged: boolean;
  onLog: () => void;
  durationMin?: number;
};

export function GymStatusCard({ logged, onLog, durationMin }: GymStatusCardProps) {
  if (!logged) {
    return (
      <Card variant="elevated">
        <View style={{ gap: space.lg }}>
          <CardHeaderRow title="Today's gym session" icon="barbell" tint={categoryAccent.positive} />
          <Text variant="callout" color={color.secondaryLabel}>
            You haven&apos;t logged today&apos;s session yet.
          </Text>
          <Button title="Log gym session" icon="barbell" onPress={onLog} accessibilityLabel="Log gym session" />
        </View>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View
          style={{
            width: layout.tapTarget,
            height: layout.tapTarget,
            borderRadius: radius.full,
            backgroundColor: surface.tile,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkmark" size={26} color={color.label} />
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="title3" color={color.label}>
            Logged today
          </Text>
          {durationMin ? (
            <Text variant="callout" color={color.secondaryLabel}>
              {formatDuration(durationMin)} session
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
