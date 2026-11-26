// Billing problem banner: shown only while the server's subscription record is
// in the store's billing grace period (past_due, written by the RevenueCat
// webhook; access still runs). Every other state, and no record yet, renders
// nothing. Same look as LoadFailedNotice; each action keeps the 44 pt target.
import type { JSX } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/components/display/toastStore';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { openManageSubscription } from '@/lib/billing/subscriptionLinks';
import { hydrateSubscription, useServerEntitlement } from '@/lib/data';
import { color, radius, space, surface } from '@/lib/design/tokens';

/** subscriptions.status for a billing issue (backend/internal/entitlement/state.go). */
export const BILLING_ISSUE = 'past_due';

export function BillingProblemBanner(): JSX.Element | null {
  const { t } = useTranslation();
  const entitlement = useServerEntitlement();
  if (entitlement?.status !== BILLING_ISSUE) return null;

  const manage = async () => {
    if (!(await openManageSubscription())) {
      showToast({ message: t('profile.manageSubscriptionFailed'), tone: 'error' });
    }
  };

  const actions = [
    { label: t('subscription.billingProblem.manage'), onPress: () => void manage() },
    { label: t('subscription.billingProblem.tryAgain'), onPress: () => void hydrateSubscription() },
  ];

  return (
    <View
      accessibilityRole="alert"
      style={{
        gap: space.xs,
        paddingTop: space.sm,
        paddingHorizontal: space.md,
        borderRadius: radius.md,
        backgroundColor: surface.tile,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon name="alert-circle-outline" size={16} color={color.secondaryLabel} />
        <Text variant="footnote" color={color.secondaryLabel} style={{ flex: 1 }}>
          {t('subscription.billingProblem.message')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: space.lg }}>
        {actions.map((a) => (
          <Pressable key={a.label} onPress={a.onPress} accessibilityRole="button" accessibilityLabel={a.label}>
            <Text variant="footnote" color={color.label}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
