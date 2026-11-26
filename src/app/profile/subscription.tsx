// E4 · Subscription
// Truthful status only: what the billing seam actually reports. Entitled →
// Active + manage/restore; not entitled → See plans + restore; billing-disabled
// dev build → an honest "not configured" note. No fabricated dates or prices —
// pricing lives on the RevenueCat paywall and in App Store subscription
// management, both reachable from here.
import { View } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { BILLING_ISSUE, BillingProblemBanner } from '@/components/display/BillingProblemBanner';
import { Card } from '@/components/display/Card';
import { Badge } from '@/components/display/Badge';
import { Button } from '@/components/forms/Button';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { useEntitlement } from '@/lib/billing/entitlement';
import { isManageSubscriptionAvailable, openManageSubscription } from '@/lib/billing/subscriptionLinks';
import { hasProEntitlement, isBillingEnabled, presentPaywall, restorePurchases } from '@/lib/billing/purchases';
import { useServerEntitlement } from '@/lib/data';
import { isDevBuild } from '@/lib/env';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SubscriptionScreen() {
  const { isEntitled, loading, refresh } = useEntitlement();
  // The server's own record (kept current by the RevenueCat webhook) wins when
  // it has one — a refund or chargeback the on-device SDK cache hasn't heard
  // about yet still shows correctly. No server row yet → RevenueCat's own read.
  const serverEntitlement = useServerEntitlement();
  const effectiveEntitled = serverEntitlement ? serverEntitlement.isActive : isEntitled;
  // The billing problem banner carries Manage subscription while payment is
  // failing, so the footer drops its copy rather than offer Apple's page twice.
  const showFooterManage = isManageSubscriptionAvailable() && serverEntitlement?.status !== BILLING_ISSUE;
  const billing = isBillingEnabled();

  const { t } = useTranslation();
  const [restoring, setRestoring] = useState(false);
  const [managing, setManaging] = useState(false);

  const manage = async () => {
    if (managing) return;
    setManaging(true);
    if (!(await openManageSubscription())) {
      showToast({ message: t('profile.manageSubscriptionFailed'), tone: 'error' });
    }
    setManaging(false);
  };

  const restore = async () => {
    if (restoring) return;
    if (!billing) {
      showToast({
        message: isDevBuild() ? t('profile.billingNotConfigured') : t('profile.purchasesUnavailable'),
        tone: 'info',
      });
      return;
    }
    setRestoring(true);
    try {
      const info = await restorePurchases();
      showToast({
        message: hasProEntitlement(info) ? t('profile.subscriptionRestored') : t('profile.noPurchasesToRestore'),
        tone: hasProEntitlement(info) ? 'success' : 'info',
      });
      refresh();
    } catch {
      showToast({ message: t('profile.storeUnreachable'), tone: 'error' });
    } finally {
      setRestoring(false);
    }
  };

  const seePlans = async () => {
    if (!billing) {
      // In a distributable build this is a packaging fault, not dev mode —
      // the app should not have started (see requiredEnv), so say something
      // true rather than "(dev)".
      showToast({
        message: isDevBuild() ? t('profile.billingNotConfigured') : t('profile.purchasesUnavailable'),
        tone: 'info',
      });
      return;
    }
    // Every outcome answered — 'unavailable' (UI module missing, or no
    // offering/paywall configured) previously did nothing at all, so the
    // button looked broken (audit 2026-08-09).
    const outcome = await presentPaywall();
    switch (outcome) {
      case 'purchased':
      case 'restored':
        showToast({ message: t('subscription.welcomePro'), tone: 'success' });
        refresh();
        break;
      case 'unavailable':
        showToast({ message: t('subscription.plansUnavailable'), tone: 'error' });
        break;
      case 'error':
        showToast({ message: t('profile.storeUnreachable'), tone: 'error' });
        break;
      case 'cancelled':
        break; // dismissing the sheet is a choice
    }
  };

  return (
    <Screen
      variant="floating"
      eyebrow={t('subscription.eyebrow')}
      title={t('settings.subscription')}
      showBack contentStyle={{ gap: space.xl }}
      footer={
        <View style={{ gap: space.sm }}>
          {effectiveEntitled ? (
            showFooterManage ? (
              <Button
                title={t('subscription.manage')}
                variant="secondary"
                loading={managing}
                onPress={() => void manage()}
              />
            ) : null
          ) : (
            <Button title={t('subscription.seePlans')} onPress={() => void seePlans()} />
          )}
          <Button title={t('profile.restorePurchases')} variant="tertiary" loading={restoring} onPress={() => void restore()} />
        </View>
      }
    >
      {/* Payment problem (store grace period) — renders null for every other state. */}
      <BillingProblemBanner />

      {/* Price, payment method, usage bars and billing history are in the design
          but not in the billing seam — see UI_PASS_GAPS.md. The card shows only
          what RevenueCat and the server's own record actually report. */}
      <Card variant="elevated">
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md }}>
            <Text variant="title3" color={color.label}>
              Lume Pro
            </Text>
            <Badge
              label={loading ? t('subscription.checking') : effectiveEntitled ? t('subscription.active') : t('subscription.notSubscribed')}
              icon={loading ? undefined : effectiveEntitled ? 'checkmark-circle' : 'close-circle'}
            />
          </View>
          <Text variant="body" color={color.secondaryLabel}>
            {effectiveEntitled ? t('subscription.activeBody') : t('subscription.inactiveBody')}
          </Text>
        </View>
      </Card>

      {!billing ? (
        <Text variant="footnote" color={color.secondaryLabel}>
          {/* "development mode" is dev-only copy: in a release build a missing
              RevenueCat key is a packaging mistake, not a mode, and App Review
              would be reading it. */}
          {isDevBuild() ? t('subscription.notConfiguredDev') : t('subscription.unavailable')}
        </Text>
      ) : (
        <Text variant="footnote" color={color.secondaryLabel}>
          {t('subscription.autoRenew')}
        </Text>
      )}
    </Screen>
  );
}
