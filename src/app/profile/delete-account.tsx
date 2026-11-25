// E12 · Delete Account flow (App Store Guideline 5.1.1(v) requires this)
// Multi-step confirmation: (1) are you sure, (2) what gets deleted, (3) type
// DELETE, (4) final. On confirm → server deletes Clerk identity + all rows →
// dispatch ACCOUNT_DELETED (machine purges every store/queue, ends the Clerk
// session, RevenueCat identity resets via the bridge, routes to onboarding).
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon } from '@/components/primitives/Icon';
import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { Text } from '@/components/primitives/Text';
import { color, layout, space } from '@/lib/design/tokens';
import { useAppState } from '@/lib/auth/appState';
import { api } from '@/lib/api';
import { showToast } from '@/components/display/toastStore';
import { isManageSubscriptionAvailable, openManageSubscription } from '@/lib/billing/subscriptionLinks';

/** The design's side padding on this screen. No token covers it. */
const SIDE_PADDING = 24;

const DELETED_DATA = ['identity', 'profile', 'gym', 'food', 'ai', 'integrations'] as const;

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const confirmWord = t('settings.deleteAccountDetails.confirmWord');
  const { dispatch } = useAppState();
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const leavingRef = useRef(false); // true once Cancel leaves the flow (skip the guard)

  // Back (header tap, swipe, hardware) steps BACK through the flow instead of
  // popping the whole screen; the `deleting` guard lets the post-delete route
  // change through (same addListener pattern as gym/session.tsx).
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (step === 0 || deleting || leavingRef.current) return;
      e.preventDefault();
      setStep(step - 1);
    });
  }, [navigation, step, deleting]);

  // Delete server-side FIRST (Clerk identity + cascading row delete), then let
  // the machine purge local state and route. On failure, surface it and let the
  // user retry — never sign them out believing they deleted an account that's
  // still on the server.
  const finish = async () => {
    setDeleting(true);
    try {
      await api.profile.delete();
      showToast({ message: t('settings.deleteAccountDetails.deleted'), tone: 'success' });
      dispatch({ type: 'ACCOUNT_DELETED' });
    } catch {
      // Never the server's text: it is written for logs, not for the user.
      showToast({ message: t('settings.deleteAccountDetails.failed'), tone: 'error' });
      setDeleting(false);
    }
  };

  const openSubscriptions = async () => {
    if (!(await openManageSubscription())) {
      showToast({ message: t('profile.manageSubscriptionFailed'), tone: 'error' });
    }
  };

  const cancel = () => {
    leavingRef.current = true;
    navigation.goBack();
  };

  return (
    <Screen
      variant="floating"
      eyebrow={t('settings.account')}
      title={step === 0 ? undefined : t('settings.accountDetails.deleteAccount')} // Screen drops the eyebrow with the title
      showBack
      contentStyle={{ paddingHorizontal: SIDE_PADDING }}
      footer={
        <View style={{ gap: space.md / 2 }}>
          {step === 0 ? (
            <Button title={t('settings.deleteAccountDetails.continue')} variant="destructive" onPress={() => setStep(1)} />
          ) : step === 1 ? (
            <Button
              title={t('settings.deleteAccountDetails.understandContinue')}
              variant="destructive"
              onPress={() => setStep(2)}
            />
          ) : (
            <Button
              title={t('settings.deleteAccountDetails.confirmButton')}
              variant="destructive"
              loading={deleting}
              disabled={deleting || confirmText.trim().toUpperCase() !== confirmWord}
              onPress={finish}
              // The border stays, in white, so the rendered height keeps 58.
              style={{ backgroundColor: color.white, borderColor: color.white }}
            />
          )}
          <Button
            title={t('common.cancel')}
            variant="tertiary"
            disabled={deleting}
            onPress={cancel}
            // Renders 48: the 24 label line plus 12 above and below.
            style={{ paddingVertical: space.md, minHeight: layout.tapTarget }}
          />
        </View>
      }
    >
      {step === 0 ? (
        <View style={{ gap: 14, alignItems: 'center' }}>
          <WarningGlyph />
          <Text variant="title2" color={color.label} style={{ textAlign: 'center' }}>
            {t('settings.deleteAccountDetails.sureTitle')}
          </Text>
          <Text variant="body" color={color.label} style={{ textAlign: 'center', fontSize: 16, lineHeight: 22 }}>
            {t('settings.deleteAccountDetails.sureBody')}
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: space.md }}>
          <Text variant="title3" color={color.label}>
            {t('settings.deleteAccountDetails.whatTitle')}
          </Text>
          {DELETED_DATA.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
              <Icon name="close-circle" size={18} color={color.label} style={{ marginTop: space.xs / 2 }} />
              <Text variant="body" color={color.label} style={{ flex: 1 }}>
                {t(`settings.deleteAccountDetails.data.${item}`)}
              </Text>
            </View>
          ))}
          <Text variant="footnote" color={color.secondaryLabel}>
            {t('settings.deleteAccountDetails.subscriptionNote')}
          </Text>
          {isManageSubscriptionAvailable() ? (
            <Button title={t('subscription.manage')} variant="tertiary" onPress={() => void openSubscriptions()} />
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: space.md }}>
          <Text variant="body" color={color.label}>
            <Trans
              i18nKey="settings.deleteAccountDetails.typeToConfirm"
              values={{ word: confirmWord }}
              components={{ bold: <Text variant="bodyBold" color={color.label} /> }}
            />
          </Text>
          <TextField
            label={t('settings.deleteAccountDetails.confirmLabel')}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={confirmWord}
          />
        </View>
      ) : null}
    </Screen>
  );
}

/** The design's warning triangle: sharp corners and a white mark. The SF Symbol has neither. */
function WarningGlyph() {
  return (
    <Svg width={42} height={42} viewBox="0 0 24 24">
      <Path d="M12 3.4l9.4 16.2H2.6z" fill={color.primary} />
      <Path d="M12 9.4v4.6" stroke={color.white} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx={12} cy={16.9} r={1.05} fill={color.white} />
    </Svg>
  );
}
