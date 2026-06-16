// GymStatusCard — the Dashboard's middle hero. Not logged → a big primary
// "Log gym session" CTA. Logged → a confirmation row with duration and a
// verification badge. This is the single most important action in the app.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';

export type GymStatusCardProps = {
  logged: boolean;
  onLog: () => void;
  durationMin?: number;
  verified?: 'healthkit' | 'manual';
};

export function GymStatusCard({ logged, onLog, durationMin, verified }: GymStatusCardProps) {
  if (!logged) {
    return (
      <Card>
        <View style={{ gap: space.md }}>
          <View style={{ gap: space.xs }}>
            <Text variant="title3" color={color.black}>
              Today&apos;s gym session
            </Text>
            <Text variant="callout" color={color.gray500}>
              You haven&apos;t logged today&apos;s session yet.
            </Text>
          </View>
          <Button title="Log gym session" icon="barbell" onPress={onLog} accessibilityLabel="Log gym session" />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: color.accentLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkmark" size={26} color={color.accentText} />
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="title3" color={color.black}>
            Logged today
          </Text>
          {durationMin ? (
            <Text variant="callout" color={color.gray500}>
              {formatDuration(durationMin)} session
            </Text>
          ) : null}
        </View>
        <Badge
          label={verified === 'healthkit' ? 'Health verified' : 'Manual'}
          tone={verified === 'healthkit' ? 'accent' : 'neutral'}
          icon={verified === 'healthkit' ? 'heart' : 'create'}
        />
      </View>
    </Card>
  );
}
