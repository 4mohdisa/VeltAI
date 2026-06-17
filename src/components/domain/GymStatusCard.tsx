// GymStatusCard — the Dashboard's middle hero. Not logged → a big primary
// "Log gym session" CTA. Logged → a confirmation row with the duration. Logging
// updates the streak only (no XP, no verification reward). The single most
// important action in the app.
import { View } from 'react-native';
import { Icon } from '@/components/primitives/Icon';

import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { color, layout, space } from '@/lib/design/tokens';
import { formatDuration } from '@/lib/formatting';

export type GymStatusCardProps = {
  logged: boolean;
  onLog: () => void;
  durationMin?: number;
};

export function GymStatusCard({ logged, onLog, durationMin }: GymStatusCardProps) {
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
            width: layout.tapTarget,
            height: layout.tapTarget,
            borderRadius: 22,
            backgroundColor: color.gray100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkmark" size={26} color={color.black} />
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
      </View>
    </Card>
  );
}
