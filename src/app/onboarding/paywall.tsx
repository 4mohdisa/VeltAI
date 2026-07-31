// Paywall step — RevenueCat's HOSTED paywall (react-native-purchases-ui), not a
// custom one: pricing, plans and the purchase CTA render from the dashboard
// configuration. The custom PlanCards/CTA from earlier phases are gone.
//
// Flow: "See plans" presents the RC paywall → purchased/restored marks entitled;
// dismissed-without-purchase still completes onboarding (entitlement gating
// decides feature access — the app's existing trial/free logic). Either way the
// assembled onboarding answers POST to /api/onboarding exactly as before.
//
// Billing-disabled dev mode (no key / Expo Go): a "Billing not configured (dev)"
// note replaces the paywall and Continue proceeds — the app stays fully usable.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { CUISINE_LABEL } from '@/components/onboarding/cuisines';
import { Button } from '@/components/forms';
import { showToast } from '@/components/display';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { api, type Onboarding } from '@/lib/api';
import { bodyFromOnboarding } from '@/lib/data/hooks';
import { useUserStore } from '@/lib/data/userStore';
import { track } from '@/lib/analytics';
import { navigate } from '@/lib/nav';
import { isBillingEnabled, presentPaywall, restorePurchases, hasProEntitlement, TRIAL_DAYS } from '@/lib/billing/purchases';
import { setHasCompletedOnboarding } from '@/lib/storage/secureStore';
import { onboardingPayload, useOnboardingStore } from '@/lib/stores/onboarding';
import { color, space } from '@/lib/design/tokens';

export default function PaywallScreen() {
  const cuisines = useOnboardingStore((s) => s.cuisines);
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    track('paywall_viewed');
  }, []);

  const cuisineLabel =
    cuisines.length > 0 ? cuisines.map((c) => CUISINE_LABEL[c]).join(', ') : 'Personalised';

  const features: string[] = [
    'Unlimited food logging',
    'Barcode + photo scanning',
    'AI Brain — learns your habits',
    `${cuisineLabel} food database`,
    'Gym tracking + streaks',
    ...(dietary.includes('halal') ? ['Halal dietary filtering'] : []),
  ];

  // Persist onboarding (unchanged from before) and enter the app.
  const completeOnboarding = async () => {
    const payload = onboardingPayload(useOnboardingStore.getState());
    try {
      await api.onboarding.post(payload);
      // Write the answers into the user store immediately. hydrateProfile picks
      // them up from the server on later launches, but without this the user
      // spends their whole first session on a 1,200 kcal / 0 g protein target,
      // because deriveGoals reads THIS store and nothing else populated it.
      useUserStore.getState().setProfile(bodyFromOnboarding(payload as unknown as Onboarding));
      track('onboarding_completed');
      markCompleted();
      await setHasCompletedOnboarding(true);
      navigate('/onboarding/done');
    } catch (e) {
      if (__DEV__) console.warn('[onboarding] submit failed:', e instanceof Error ? e.message : e);
      showToast({
        message: "Couldn't finish setup — check your connection and try again.",
        tone: 'error',
      });
      setSubmitting(false);
    }
  };

  // Present RevenueCat's paywall, then complete onboarding regardless of the
  // purchase outcome (dismiss = free tier; entitlement gates access later).
  const handleContinue = async () => {
    setSubmitting(true);
    if (isBillingEnabled()) {
      const outcome = await presentPaywall();
      if (outcome === 'purchased' || outcome === 'restored') {
        showToast({ message: "You're all set — welcome to Lumo Pro!", tone: 'success' });
      } else if (outcome === 'error') {
        showToast({ message: "The store couldn't be reached — you can subscribe later in Settings.", tone: 'info' });
      }
    }
    await completeOnboarding();
  };

  const restore = async () => {
    if (!isBillingEnabled()) {
      showToast({ message: 'Billing not configured (dev).', tone: 'info' });
      return;
    }
    setRestoring(true);
    try {
      const info = await restorePurchases();
      showToast({
        message: hasProEntitlement(info) ? 'Subscription restored.' : 'No previous subscription found.',
        tone: hasProEntitlement(info) ? 'success' : 'info',
      });
    } catch {
      showToast({ message: "Couldn't reach the store — try again later.", tone: 'error' });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <OnbScaffold
      step={10}
      scroll
      title="Everything's ready for you"
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title={isBillingEnabled() ? 'See plans & start free trial' : 'Continue'}
            loading={submitting}
            onPress={() => void handleContinue()}
          />
          {!isBillingEnabled() ? (
            <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
              Billing not configured (dev) — continuing without a paywall
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={restoring}
            onPress={() => void restore()}
          >
            <Text variant="footnote" color={color.label} style={{ textAlign: 'center' }}>
              {restoring ? 'Restoring…' : 'Already subscribed? Restore purchases'}
            </Text>
          </Pressable>
          {/* 3.1.2 — Terms + Privacy stay reachable at the paywall entry (the
              hosted paywall renders pricing; these links frame it). Footnote
              text is ~18pt tall; 14pt vertical hitSlop makes each link ≥44pt. */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.md }}>
            <Pressable
              accessibilityRole="link"
              minTapTarget={false}
              hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
              onPress={() => router.push('/legal/terms' as Href)}
            >
              <Text variant="footnote" color={color.secondaryLabel} style={{ textDecorationLine: 'underline' }}>
                Terms
              </Text>
            </Pressable>
            <Text variant="footnote" color={color.secondaryLabel}>
              ·
            </Text>
            <Pressable
              accessibilityRole="link"
              minTapTarget={false}
              hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
              onPress={() => router.push('/legal/privacy' as Href)}
            >
              <Text variant="footnote" color={color.secondaryLabel} style={{ textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View style={{ gap: space.md }}>
        {features.map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Icon name="checkmark-circle" size={20} color={color.label} />
            <Text variant="body" color={color.gray800} style={{ flex: 1 }}>
              {f}
            </Text>
          </View>
        ))}
        <Text variant="footnote" color={color.secondaryLabel} style={{ marginTop: space.md }}>
          Plans and pricing are shown on the next screen. {TRIAL_DAYS}-day free trial, auto-renews,
          cancel anytime in Settings.
        </Text>
      </View>
    </OnbScaffold>
  );
}
