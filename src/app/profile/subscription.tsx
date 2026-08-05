// E4 · Subscription
// Truthful status only: what the billing seam actually reports. Entitled →
// Active + manage/restore; not entitled → See plans + restore; billing-disabled
// dev build → an honest "not configured" note. No fabricated dates or prices —
// pricing lives on the RevenueCat paywall and in App Store subscription
// management, both reachable from here.
import { Linking, View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { useEntitlement } from '@/lib/billing/entitlement';
import { hasProEntitlement, isBillingEnabled, presentPaywall, restorePurchases } from '@/lib/billing/purchases';
import { isDevBuild } from '@/lib/env';
import { useState } from 'react';

const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

export default function SubscriptionScreen() {
  const { isEntitled, loading, refresh } = useEntitlement();
  const billing = isBillingEnabled();

  const [restoring, setRestoring] = useState(false);

  const restore = async () => {
    if (restoring) return;
    if (!billing) {
      showToast({
        message: isDevBuild()
          ? 'Billing not configured (dev).'
          : 'Purchases are temporarily unavailable. Please try again later.',
        tone: 'info',
      });
      return;
    }
    setRestoring(true);
    try {
      const info = await restorePurchases();
      showToast({
        message: hasProEntitlement(info) ? 'Subscription restored.' : 'No purchases to restore.',
        tone: hasProEntitlement(info) ? 'success' : 'info',
      });
      refresh();
    } catch {
      showToast({ message: "Couldn't reach the store — try again later.", tone: 'error' });
    } finally {
      setRestoring(false);
    }
  };

  const seePlans = async () => {
    if (!billing) {
      showToast({ message: 'Billing not configured (dev).', tone: 'info' });
      return;
    }
    const outcome = await presentPaywall();
    if (outcome === 'purchased' || outcome === 'restored') {
      showToast({ message: "You're all set — welcome to Lume Pro!", tone: 'success' });
      refresh();
    } else if (outcome === 'error') {
      showToast({ message: "The store couldn't be reached — try again later.", tone: 'error' });
    }
  };

  return (
    <Screen grouped
      title="Subscription"
      showBack
      footer={
        <View style={{ gap: space.sm }}>
          {isEntitled ? (
            <Button
              title="Manage subscription"
              variant="secondary"
              onPress={() => Linking.openURL(MANAGE_URL).catch(() => {})}
            />
          ) : (
            <Button title="See plans" onPress={() => void seePlans()} />
          )}
          <Button title="Restore Purchases" variant="tertiary" onPress={() => void restore()} />
        </View>
      }
    >
      <Card>
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="title3" color={color.black}>
              Lume Pro
            </Text>
            <Badge
              label={loading ? 'Checking…' : isEntitled ? 'Active' : 'Not subscribed'}
              icon={loading ? undefined : isEntitled ? 'checkmark-circle' : 'close-circle'}
            />
          </View>
          <Text variant="body" color={color.gray700}>
            {isEntitled
              ? 'Your subscription is active. Billing, renewal and cancellation are managed through your Apple account.'
              : 'Plans, pricing and the free trial are shown on the plans screen before any purchase.'}
          </Text>
        </View>
      </Card>

      {!billing ? (
        <Text variant="footnote" color={color.gray500}>
          {/* "development mode" is dev-only copy: in a release build a missing
              RevenueCat key is a packaging mistake, not a mode, and App Review
              would be reading it. */}
          {isDevBuild()
            ? 'Billing is not configured in this build (development mode).'
            : 'Subscriptions are temporarily unavailable. Please try again later.'}
        </Text>
      ) : (
        <Text variant="footnote" color={color.gray500}>
          Subscriptions auto-renew until cancelled. Cancel anytime in Settings → your name →
          Subscriptions — Apple handles all billing.
        </Text>
      )}
    </Screen>
  );
}
