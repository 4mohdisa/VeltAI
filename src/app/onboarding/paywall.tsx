// Paywall step — RevenueCat's HOSTED paywall (react-native-purchases-ui), not a
// custom one: pricing, plans and the purchase CTA render from the dashboard
// configuration. The custom PlanCards/CTA from earlier phases are gone.
//
// Flow: "See plans" presents the RC paywall. There is no free tier, so the
// onboarding answers POST to /api/onboarding only once the backend's
// subscription status confirms a trial or an active plan (the same record the
// entitlement gate reads). A dismissed paywall saves nothing: the answers stay
// in the onboarding store on the device until a later purchase or restore.
//
// Billing-disabled dev mode (no key / Expo Go): a "Billing not configured (dev)"
// note replaces the paywall and Continue proceeds — the app stays fully usable.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
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
import { onboardingPayload, useOnboardingStore, validateOnboardingPayload } from '@/lib/stores/onboarding';
import { color, space } from '@/lib/design/tokens';
import { devWarn, isDevBuild } from '@/lib/env';
import { useAppState } from '@/lib/auth/appState';
import { classifyConnectivity } from '@/lib/auth/machine';

export default function PaywallScreen() {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const cuisines = useOnboardingStore((s) => s.cuisines);
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    track('paywall_viewed');
  }, []);

  const features: string[] = [
    t('onboarding.paywall.features.unlimitedLogging'),
    t('onboarding.paywall.features.scanning'),
    t('onboarding.paywall.features.aiBrain'),
    cuisines.length > 0
      ? t('onboarding.paywall.features.cuisineDatabase', {
          cuisines: cuisines.map((c) => t(`onboarding.cuisine.options.${c}`)).join(', '),
        })
      : t('onboarding.paywall.features.personalisedDatabase'),
    t('onboarding.paywall.features.gym'),
    ...(dietary.includes('halal') ? [t('onboarding.paywall.features.halal')] : []),
  ];

  // Persist onboarding (unchanged from before) and enter the app.
  const completeOnboarding = async () => {
    const session = useOnboardingStore.getState();
    // Check the contract BEFORE spending a request, so a missing answer is
    // named here rather than coming back as an opaque 400 (audit 2026-08-08).
    const problem = validateOnboardingPayload(session);
    if (problem) {
      showToast({ message: problem, tone: 'error' });
      setSubmitting(false);
      return;
    }
    const payload = onboardingPayload(session);
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
      devWarn('[onboarding] submit failed:', e);
      // An expired session is not a connection problem. The machine ends the
      // rejected Clerk session, keeps the onboarding answers, opens sign-in and
      // shows the expired message.
      if (classifyConnectivity(e) === 'sessionExpired') {
        setSubmitting(false);
        dispatch({ type: 'SESSION_ENDED' });
        return;
      }
      // Any other failure, a 4xx included, shows translated copy. The server's
      // message is English-only and is kept in the dev log above.
      showToast({ message: t('onboarding.paywall.submitFailed'), tone: 'error' });
      setSubmitting(false);
    }
  };

  // Save only once the backend confirms a trial or an active plan; until then
  // the answers stay on the device.
  const completeIfSubscribed = async () => {
    const sub = await api.subscription.get().catch(() => null);
    if (!sub?.is_active) {
      showToast({ message: t('onboarding.paywall.notConfirmed'), tone: 'info' });
      setSubmitting(false);
      return;
    }
    await completeOnboarding();
  };

  // Present RevenueCat's paywall; only a purchase or restore goes on to save.
  const handleContinue = async () => {
    setSubmitting(true);
    if (isBillingEnabled()) {
      const outcome = await presentPaywall();
      // EVERY outcome is answered. 'unavailable' — the paywall UI module
      // failing to load, or no offering/paywall configured in the RevenueCat
      // dashboard — used to fall through this chain silently: the tester taps
      // "See plans", nothing whatsoever happens, and onboarding completes as
      // if they had declined. That was the open FINAL_AUDIT item and it is
      // exactly what a sandbox build exercises first (audit 2026-08-09).
      switch (outcome) {
        case 'purchased':
        case 'restored':
          showToast({ message: t('subscription.welcomePro'), tone: 'success' });
          break;
        case 'unavailable':
          showToast({
            message: t('onboarding.paywall.plansUnavailable'),
            tone: 'error',
          });
          break;
        case 'error':
          showToast({ message: t('onboarding.paywall.storeError'), tone: 'info' });
          break;
        case 'cancelled':
          break; // deliberate: dismissing the sheet is a choice, not a fault
      }
      if (outcome !== 'purchased' && outcome !== 'restored') {
        setSubmitting(false);
        return;
      }
      await completeIfSubscribed();
      return;
    }
    await completeOnboarding();
  };

  const restore = async () => {
    if (!isBillingEnabled()) {
      showToast({ message: t('profile.billingNotConfigured'), tone: 'info' });
      return;
    }
    setRestoring(true);
    let restored = false;
    try {
      restored = hasProEntitlement(await restorePurchases());
      showToast({
        message: restored ? t('profile.subscriptionRestored') : t('onboarding.paywall.noSubscription'),
        tone: restored ? 'success' : 'info',
      });
    } catch {
      showToast({ message: t('profile.storeUnreachable'), tone: 'error' });
    } finally {
      setRestoring(false);
    }
    if (restored) {
      setSubmitting(true);
      await completeIfSubscribed();
    }
  };

  return (
    <OnbScaffold
      step={11}
      scroll
      title={t('onboarding.paywall.title')}
      footer={
        <View style={{ gap: space.sm }}>
          <Button
            title={isBillingEnabled() ? t('onboarding.paywall.seePlans') : t('onboarding.measurements.continue')}
            loading={submitting}
            onPress={() => void handleContinue()}
          />
          {!isBillingEnabled() && isDevBuild() ? (
            <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
              {t('onboarding.paywall.devBillingNote')}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={restoring}
            onPress={() => void restore()}
          >
            <Text variant="footnote" color={color.label} style={{ textAlign: 'center' }}>
              {restoring ? t('onboarding.paywall.restoring') : t('onboarding.paywall.restore')}
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
                {t('signup.legalTerms')}
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
                {t('signup.legalPrivacy')}
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
          {t('onboarding.paywall.trialNote', { days: TRIAL_DAYS })}
        </Text>
      </View>
    </OnbScaffold>
  );
}
