// Paywall step — the app's own paywall on src/lib/purchases/revenuecat.ts:
// each package from the current offering with the store's own price and period,
// a trial line only when the store says that package is trial eligible, then
// purchase or restore.
//
// There is no free tier, so the onboarding answers POST to /api/onboarding only
// once the backend's subscription status confirms a trial or an active plan
// (the same record the entitlement gate reads). A cancelled or failed purchase
// saves nothing: the answers stay in the onboarding store on the device.
//
// Billing not configured: a release build shows plans unavailable; a dev build
// (no key / Expo Go) shows the dev note and Continue proceeds, so the app stays
// fully usable.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button } from '@/components/forms';
import { LoadFailedNotice, showToast } from '@/components/display';
import { SkeletonList } from '@/components/display/LoadingSkeleton';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { Icon } from '@/components/primitives/Icon';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { api, ApiError, sleep, type Onboarding } from '@/lib/api';
import { bodyFromOnboarding } from '@/lib/data/hooks';
import { entitlementFromApi } from '@/lib/data/mappers';
import { useSettingsStore } from '@/lib/settings/store';
import { useUserStore } from '@/lib/data/userStore';
import { track } from '@/lib/analytics';
import { navigate } from '@/lib/nav';
import { isBillingEnabled, TRIAL_DAYS } from '@/lib/billing/purchases';
import {
  getEntitlementState,
  getOfferings,
  isEntitledState,
  purchasePackage,
  restorePurchases,
} from '@/lib/purchases/revenuecat';
import type { Offering, PurchasablePackage } from '@/lib/purchases/types';
import { setHasCompletedOnboarding } from '@/lib/storage/secureStore';
import { onboardingPayload, useOnboardingStore, validateOnboardingPayload } from '@/lib/stores/onboarding';
import { color, space } from '@/lib/design/tokens';
import { devWarn, isDevBuild } from '@/lib/env';
import { useAppState } from '@/lib/auth/appState';
import { classifyConnectivity } from '@/lib/auth/machine';

// Right after a purchase the backend may not have RevenueCat's webhook yet, so
// the subscription check is retried before the screen gives up. The confirmed
// status replaces the stored entitlement, so later screens read the new plan.
const CONFIRM_ATTEMPTS = 4;
const CONFIRM_DELAY_MS = 1500;

async function subscriptionConfirmed(): Promise<boolean> {
  for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(CONFIRM_DELAY_MS);
    const sub = await api.subscription.get().catch((e: unknown) => {
      // An expired session is not "not confirmed yet": the caller ends it.
      if (classifyConnectivity(e) === 'sessionExpired') throw e;
      return null;
    });
    if (sub?.is_active) {
      useSettingsStore.getState().setServerEntitlement(entitlementFromApi(sub));
      return true;
    }
  }
  return false;
}

// The 402 gate's refusal reasons (backend/internal/entitlement/state.go).
const REFUSAL_REASONS = ['trial_ended', 'expired', 'billing_failed', 'cancelled_ended', 'refunded', 'not_subscribed'];

/** The i18n key for a 402 refusal; an unknown or missing reason uses storeError. */
function refusalKey(reason: string | undefined): string {
  return reason && REFUSAL_REASONS.includes(reason)
    ? `onboarding.paywall.refusal.${reason}`
    : 'onboarding.paywall.storeError';
}

type Plans = { status: 'loading' } | { status: 'error' } | { status: 'ready'; packages: PurchasablePackage[] };

/** The current offering's packages; none (or a failed read) is the error state. */
function plansFrom(offerings: Offering[]): Plans {
  const packages = offerings[0]?.packages ?? [];
  return packages.length > 0 ? { status: 'ready', packages } : { status: 'error' };
}

export default function PaywallScreen() {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const cuisines = useOnboardingStore((s) => s.cuisines);
  const dietary = useOnboardingStore((s) => s.dietary_requirements);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const billing = isBillingEnabled();
  const [plans, setPlans] = useState<Plans>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Set by the launch gate when GET /api/onboarding is refused with a 402.
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  useEffect(() => {
    track('paywall_viewed');
  }, []);

  useEffect(() => {
    if (!billing) return;
    let alive = true;
    void getOfferings().then((offerings) => {
      if (alive) setPlans(plansFrom(offerings));
    });
    return () => {
      alive = false;
    };
  }, [billing]);

  const retryPlans = () => {
    setPlans({ status: 'loading' });
    void getOfferings().then((offerings) => setPlans(plansFrom(offerings)));
  };

  const selected =
    plans.status === 'ready' ? (plans.packages.find((p) => p.productId === selectedId) ?? plans.packages[0]) : undefined;

  useEffect(() => {
    if (reason) showToast({ message: t(refusalKey(reason)), tone: 'error' });
  }, [reason, t]);

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

  // An expired session is not a connection problem. The machine ends the
  // rejected Clerk session, keeps the onboarding answers, opens sign-in and
  // shows the expired message.
  const endExpiredSession = () => {
    setSubmitting(false);
    dispatch({ type: 'SESSION_ENDED' });
  };

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
      if (classifyConnectivity(e) === 'sessionExpired') {
        endExpiredSession();
        return;
      }
      // A 402 says why access was refused; any other failure, a 4xx included,
      // shows translated copy. The server's message is English-only and is
      // kept in the dev log above.
      const message =
        e instanceof ApiError && e.status === 402 ? t(refusalKey(e.reason)) : t('onboarding.paywall.submitFailed');
      showToast({ message, tone: 'error' });
      setSubmitting(false);
    }
  };

  // Save only once the backend confirms a trial or an active plan; until then
  // the answers stay on the device.
  const completeIfSubscribed = async () => {
    let confirmed: boolean;
    try {
      confirmed = await subscriptionConfirmed();
    } catch {
      // subscriptionConfirmed only throws on a 401.
      endExpiredSession();
      return;
    }
    if (!confirmed) {
      showToast({ message: t('onboarding.paywall.notConfirmed'), tone: 'info' });
      setSubmitting(false);
      return;
    }
    await completeOnboarding();
  };

  // Buy the selected package; only a purchase goes on to save. Cancelling is a
  // choice, not a fault: the screen stays as it was, with no message.
  const handleContinue = async () => {
    setSubmitting(true);
    if (!billing) {
      await completeOnboarding();
      return;
    }
    if (!selected) {
      setSubmitting(false);
      return;
    }
    const result = await purchasePackage(selected);
    if (result.kind !== 'purchased') {
      if (result.kind === 'error') showToast({ message: t('onboarding.paywall.storeError'), tone: 'info' });
      setSubmitting(false);
      return;
    }
    if (isEntitledState(await getEntitlementState())) {
      showToast({ message: t('subscription.welcomePro'), tone: 'success' });
    }
    await completeIfSubscribed();
  };

  const restore = async () => {
    if (!billing) {
      showToast({ message: t('profile.billingNotConfigured'), tone: 'info' });
      return;
    }
    setRestoring(true);
    const restored = isEntitledState(await restorePurchases());
    setRestoring(false);
    showToast({
      message: restored ? t('profile.subscriptionRestored') : t('onboarding.paywall.noSubscription'),
      tone: restored ? 'success' : 'info',
    });
    if (restored) {
      setSubmitting(true);
      await completeIfSubscribed();
    }
  };

  const showCta = billing ? plans.status === 'ready' : isDevBuild();
  const ctaTitle = !billing
    ? t('onboarding.measurements.continue')
    : selected?.trialEligible
      ? t('onboarding.paywall.startTrial')
      : t('onboarding.paywall.subscribe');

  return (
    <OnbScaffold
      step={11}
      scroll
      title={t('onboarding.paywall.title')}
      footer={
        <View style={{ gap: space.sm }}>
          {showCta ? <Button title={ctaTitle} loading={submitting} onPress={() => void handleContinue()} /> : null}
          {!billing && isDevBuild() ? (
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
          {/* 3.1.2 — Terms + Privacy stay reachable next to the purchase.
              Footnote text is ~18pt tall; 14pt vertical hitSlop makes each
              link ≥44pt. */}
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
        <View style={{ gap: space.sm, marginTop: space.md }}>
          {!billing ? (
            isDevBuild() ? null : (
              <Text variant="footnote" color={color.secondaryLabel}>
                {t('onboarding.paywall.plansUnavailable')}
              </Text>
            )
          ) : plans.status === 'loading' ? (
            <SkeletonList rows={2} />
          ) : plans.status === 'error' ? (
            <LoadFailedNotice message={t('onboarding.paywall.plansUnavailable')} onRetry={retryPlans} />
          ) : (
            plans.packages.map((p) => (
              <View key={p.productId} style={{ gap: space.xs }}>
                <OptionCard
                  label={t('onboarding.paywall.packageLabel', { period: p.periodLabel, price: p.priceString })}
                  selected={p.productId === selected?.productId}
                  onPress={() => setSelectedId(p.productId)}
                />
                {p.trialEligible ? (
                  <Text variant="footnote" color={color.secondaryLabel}>
                    {t('onboarding.paywall.trialLine', { days: TRIAL_DAYS })}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </View>
    </OnbScaffold>
  );
}
