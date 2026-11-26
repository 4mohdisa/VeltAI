// Row 8 · Win back
// For a plan that has ended or been cancelled: what the user keeps, the store's
// own price, and a way back to the paywall. The price comes from the purchases
// wrapper only; nothing here names a price, period or discount. Any other
// status, or no server record, goes back to Subscription.
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EXPIRED } from '@/app/profile/subscription';
import { Card } from '@/components/display/Card';
import { Button } from '@/components/forms/Button';
import { Screen } from '@/components/navigation/Screen';
import { Text } from '@/components/primitives/Text';
import { useServerEntitlement } from '@/lib/data';
import { color, space } from '@/lib/design/tokens';
import { paywallHref, WINBACK_REASON } from '@/lib/nav';
import { getOfferings } from '@/lib/purchases/revenuecat';
import type { PurchasablePackage } from '@/lib/purchases/types';

/** subscriptions.status for a cancelled plan (backend/internal/entitlement/state.go). */
const CANCELLED = 'cancelled';

export default function WinbackScreen() {
  const { t } = useTranslation();
  const status = useServerEntitlement()?.status;
  const eligible = status === EXPIRED || status === CANCELLED;
  // undefined while the store loads; null when it has no package to show.
  const [pkg, setPkg] = useState<PurchasablePackage | null | undefined>(undefined);

  useEffect(() => {
    if (!eligible) {
      router.replace('/profile/subscription');
      return;
    }
    let alive = true;
    // ponytail: the current offering's first package; pick by period if the offer lists several.
    void getOfferings().then((offerings) => {
      if (alive) setPkg(offerings[0]?.packages[0] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <Screen
      variant="floating"
      eyebrow={t('subscription.eyebrow')}
      title={t('subscription.winback.title')}
      showBack
      contentStyle={{ gap: space.xl }}
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title={t('subscription.expired.resubscribe')}
            onPress={() => router.push(paywallHref(WINBACK_REASON) as Href)}
          />
          <Button title={t('subscription.winback.notNow')} variant="tertiary" onPress={() => router.back()} />
        </View>
      }
    >
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <Text variant="body" color={color.secondaryLabel}>
            {t('subscription.winback.body')}
          </Text>
          {pkg === undefined ? (
            <Text variant="footnote" color={color.secondaryLabel}>
              {t('subscription.checking')}
            </Text>
          ) : pkg ? (
            <Text variant="title3" color={color.label}>
              {t('subscription.winback.price', { price: pkg.priceString, period: pkg.periodLabel })}
            </Text>
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
