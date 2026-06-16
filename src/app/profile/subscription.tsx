// E4 · Subscription
// Current plan, next renewal date, Manage subscription (deep-links to iOS
// Settings), and the App-Store-required Restore Purchases button.
import { Linking, View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { formatCurrency, formatLongDate } from '@/lib/formatting';
import { mockSubscription } from '@/lib/mock/data';

export default function SubscriptionScreen() {
  return (
    <Screen
      title="Subscription"
      showBack
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title="Manage subscription"
            variant="secondary"
            onPress={() => Linking.openURL('app-settings:').catch(() => {})}
          />
          <Button
            title="Restore Purchases"
            variant="tertiary"
            onPress={() => showToast({ message: 'Purchases restored.', tone: 'success' })}
          />
        </View>
      }
    >
      <Card>
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="title3" color={color.black}>
              {mockSubscription.plan}
            </Text>
            <Badge label="Free trial" />
          </View>
          <Text variant="body" color={color.gray700}>
            {formatCurrency(mockSubscription.price)} / month after your trial
          </Text>
          <View style={{ height: 1, backgroundColor: color.gray100 }} />
          <View style={{ gap: space.xs }}>
            <Row label="Trial ends" value={formatLongDate(mockSubscription.trialEnd)} />
            <Row label="First charge" value={formatLongDate(mockSubscription.renewsOn)} />
            <Row label="Renews" value="Monthly · cancel anytime" />
          </View>
        </View>
      </Card>

      <Text variant="footnote" color={color.gray500}>
        One price, shown everywhere. We&apos;ll remind you 2 days before your trial ends. Cancel
        anytime in iPhone Settings — no charge until the trial is over.
      </Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="callout" color={color.gray500}>
        {label}
      </Text>
      <Text variant="callout" color={color.black}>
        {value}
      </Text>
    </View>
  );
}
