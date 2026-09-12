// E1 · Profile — one screen: identity, the streak, and the whole settings list.
//
// Architecture item 6 (DECISIONS.md "Design-file UI pass"): the design's Profile
// IS the settings list — the user's name as the eyebrow over a "Settings" title,
// then the grouped rows. We used to split that across two routes; `profile/
// settings.tsx` is now merged in here and deleted, so nothing pushes
// /profile/settings any more.
//
// Chrome is hand-rolled rather than `Screen variant="floating"` — this file
// carried the treatment by hand from when it was a tab screen, and item 1 moved
// it onto the root stack unchanged. Same three parts as the scaffold: grey page,
// blurred header strip, floating glass back button. Streak-only (no XP, no
// ranks, no points).
import { Alert, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router, type Href } from 'expo-router';

import { Avatar } from '@/components/display/Avatar';
import { Card } from '@/components/display/Card';
import { CardHeaderRow } from '@/components/display/CardHeaderRow';
import { SettingsList } from '@/components/display/SettingsList';
import { Stat } from '@/components/display/Stat';
import { LoadFailedNotice } from '@/components/display/LoadFailedNotice';
import { Text } from '@/components/primitives/Text';
import { FloatingHeader } from '@/components/navigation/FloatingHeader';
import { GlassBackButton } from '@/components/navigation/GlassButtons';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { showToast } from '@/components/display/toastStore';
import { hasProEntitlement, isBillingEnabled, restorePurchases } from '@/lib/billing/purchases';
import { useAppState } from '@/lib/auth/appState';
import { isDevBuild } from '@/lib/env';
import { accent, categoryAccent, color, layout, space, surface } from '@/lib/design/tokens';
import { useUserProfile, useGym } from '@/lib/data';

// Restore Purchases (Apple requires this for any app with IAP). Result via toast.
// Guards against a double tap: the row has no busy state, so without this a
// second tap fires a second StoreKit restore whose result races the first and
// can leave the user reading "Subscription restored" followed by "No purchases
// to restore" for the same account.
let restoring = false;

async function restore(): Promise<void> {
  if (restoring) return;
  if (!isBillingEnabled()) {
    showToast({
      message: isDevBuild()
        ? 'Billing not configured (dev).'
        : 'Purchases are temporarily unavailable. Please try again later.',
      tone: 'info',
    });
    return;
  }
  restoring = true;
  try {
    const info = await restorePurchases();
    showToast({
      message: hasProEntitlement(info) ? 'Subscription restored.' : 'No purchases to restore.',
      tone: hasProEntitlement(info) ? 'success' : 'info',
    });
  } catch {
    showToast({ message: "Couldn't reach the store — try again later.", tone: 'error' });
  } finally {
    restoring = false;
  }
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useUserProfile();
  const insets = useSafeAreaInsets();
  const { dispatch } = useAppState();
  const {
    data: { streak },
    error: gymError,
    refetch: refetchGym,
  } = useGym();

  // SIGN_OUT → machine purges every store + offline queue, ends the Clerk
  // session (signOutSeam), RevenueCat identity resets via the bridge.
  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your data stays in your account — sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => dispatch({ type: 'SIGN_OUT' }) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: surface.backgroundAlt }}>
      <ScrollView
        contentContainerStyle={{
          // Clear the floating back button's full height, or it draws across the
          // large title and clips the eyebrow.
          paddingTop: insets.top + layout.tapTarget + space.md,
          paddingHorizontal: space.lg,
          gap: space.md,
          paddingBottom: space['4xl'] + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* The streak read failed, so the card below is showing whatever the
            device already had. Label it rather than let it pass as current. */}
        {gymError ? <LoadFailedNotice message="Couldn't load your gym data." onRetry={refetchGym} /> : null}

        {/* Title block — the name only appears here; the avatar below carries no
            second copy of it. Before hydration there is no name, and a
            placeholder would be a fabricated one, so the eyebrow is omitted. */}
        <View style={{ gap: space.xs, paddingBottom: space.xs }}>
          {profile.name ? (
            <Text variant="label" color={color.secondaryLabel} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {profile.name}
            </Text>
          ) : null}
          <Text variant="title1" color={color.label} accessibilityRole="header">
            {t('settings.title')}
          </Text>
        </View>

        <View style={{ alignItems: 'center', paddingBottom: space.sm }}>
          <Avatar name={profile.name} size={84} />
        </View>

        {/* Streak centrepiece */}
        <Card variant="elevated">
          <View style={{ gap: space.lg }}>
            <CardHeaderRow title="Streak" icon="flame" tint={categoryAccent.streak} />
            <StreakCounter days={streak.current} />
          </View>
        </Card>

        {/* Streak stats */}
        <Card variant="elevated">
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={streak.longest} label="Longest" size="medium" align="center" />
            <Stat value={streak.totalGymDays} label="Total days" size="medium" align="center" />
            <Stat value={streak.freezesAvailable} label="Freezes" size="medium" align="center" />
          </View>
        </Card>

        <SettingsList
          title={t('settings.groupAccount')}
          rows={[
            { icon: 'person-outline', label: t('settings.account'), onPress: () => router.push('/profile/account') },
            { icon: 'card-outline', tint: accent.purple, label: t('settings.subscription'), onPress: () => router.push('/profile/subscription') },
            { icon: 'refresh-outline', label: 'Restore Purchases', onPress: () => void restore() },
            { icon: 'flag-outline', tint: categoryAccent.calories, label: t('settings.goals'), onPress: () => router.push('/profile/goals') },
            { icon: 'options-outline', tint: categoryAccent.positive, label: t('settings.scanAccuracy'), onPress: () => router.push('/profile/scan-calibration' as Href) },
            { icon: 'sparkles-outline', tint: categoryAccent.ai, label: 'AI insights', onPress: () => router.push('/insights' as Href) },
          ]}
        />
        <SettingsList
          title={t('settings.groupApp')}
          rows={[
            { icon: 'options-outline', label: t('settings.preferences'), onPress: () => router.push('/profile/preferences') },
            // Notifications row removed (audit 2026-08-06): the preferences
            // screen offered "What we send" toggles + quiet hours for a
            // notification system that does not exist in the build — dead UI
            // masquerading as a feature (App Store 2.1). Restore the row when
            // something actually sends notifications.
            { icon: 'link-outline', tint: accent.turquoise, label: 'Connected apps', onPress: () => router.push('/profile/integrations' as Href) },
          ]}
        />
        <SettingsList
          title={t('settings.groupAbout')}
          rows={[
            { icon: 'shield-checkmark-outline', label: t('settings.privacy'), onPress: () => router.push('/profile/privacy') },
            { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => router.push('/legal/terms' as Href) },
            { icon: 'lock-closed-outline', label: 'Privacy Policy', onPress: () => router.push('/legal/privacy' as Href) },
            { icon: 'help-circle-outline', label: t('settings.support'), onPress: () => router.push('/profile/support') },
            { icon: 'information-circle-outline', label: t('settings.about'), onPress: () => router.push('/profile/about') },
          ]}
        />
        <SettingsList
          rows={[
            { icon: 'log-out-outline', label: 'Sign out', onPress: confirmSignOut },
            {
              icon: 'trash-outline',
              label: 'Delete my account',
              destructive: true,
              onPress: () => router.push('/profile/delete-account'),
            },
          ]}
        />
      </ScrollView>
      <FloatingHeader height={insets.top + space.xl} />
      {/* Item 1 pushed this screen onto the root stack; a swipe was left as its
          only way back. The design's Profile chrome is exactly this one control. */}
      <View style={{ position: 'absolute', top: insets.top + space.xs, left: space.lg }}>
        <GlassBackButton />
      </View>
    </View>
  );
}
