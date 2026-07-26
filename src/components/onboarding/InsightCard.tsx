// InsightCard — a Card with a black checkmark disc and a line or two of copy.
// Used on the onboarding preview screen to show what Lumo already knows.
import { View } from 'react-native';

import { Card } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Text } from '@/components/primitives/Text';
import { color, radius, space } from '@/lib/design/tokens';

export type InsightCardProps = { text: string };

export function InsightCard({ text }: InsightCardProps) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: radius.full,
            backgroundColor: color.black,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="checkmark" size={16} color={color.white} />
        </View>
        <Text variant="body" color={color.label} style={{ flex: 1 }}>
          {text}
        </Text>
      </View>
    </Card>
  );
}
