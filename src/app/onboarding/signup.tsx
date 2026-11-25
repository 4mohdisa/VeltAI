// Sign up / sign in — real Clerk auth (Apple + Google SSO, email-code OTP).
//
// DECISION: email uses the CODE (OTP) strategy, not passwords — fewer screens,
// no reset flow, and it doubles as verification. Sign-in and sign-up share the
// same OTP UI; "Already have an account?" toggles the mode, and ?mode=signin
// (the Welcome screen's Sign in link) opens it in sign-in mode.
//
// Post-auth the SCREEN owns routing (not the machine): the server's onboarding
// status is the truth (the local store is empty on a fresh install) — completed
// → straight to the app; otherwise the onboarding flow continues to
// measurements and submits via POST /api/onboarding at the end, exactly as
// before. With no Clerk key (local dev auth mode) the original stub behaviour
// remains so Expo Go stays fully navigable.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';

import { AppleSignInButton } from '@/components/onboarding/AppleSignInButton';
import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, TextField } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';
import { isClerkEnabled } from '@/lib/auth/clerkEnv';
import { useAppState } from '@/lib/auth/appState';
import { classifyConnectivity, type AuthEvent } from '@/lib/auth/machine';
import { api } from '@/lib/api';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { resolvePostAuth } from '@/lib/onboarding/postAuth';
import { getHasCompletedOnboarding, setHasCompletedOnboarding } from '@/lib/storage/secureStore';
import { devWarn } from '@/lib/env';
import i18n from '@/lib/i18n';

// Recommended by Clerk's Expo SSO docs: completes any pending auth session.
WebBrowser.maybeCompleteAuthSession();

type Provider = 'apple' | 'google' | 'email';
type Mode = 'signup' | 'signin';

/**
 * After a session is active: route by the SERVER's onboarding status.
 *
 * "No onboarding record" and "the request failed" are NOT the same thing, and
 * conflating them silently re-onboarded an existing user whose network
 * hiccupped — they were walked back through the whole flow and their answers
 * re-submitted (audit 2026-08-08).
 *
 * - 200 completed      → into the app.
 * - 200 not completed  → they genuinely have no record; start the flow.
 * - 401                → the session is not valid: sign in again. Not a
 *                        network error, and the saved answers stay as they are.
 * - request FAILED     → we do not know. Trust the local completion flag if
 *                        there is one, and only fall through to the flow when
 *                        nothing local says otherwise. Say so either way.
 */
async function continueAfterAuth(dispatch: (event: AuthEvent) => void): Promise<void> {
  let serverCompleted: boolean | undefined;
  try {
    serverCompleted = (await api.onboarding.get()).completed;
  } catch (e) {
    devWarn('[onboarding] status check failed:', e);
    if (classifyConnectivity(e) === 'sessionExpired') {
      // The machine ends the rejected Clerk session, keeps the onboarding
      // answers, opens sign-in and shows the expired message.
      dispatch({ type: 'SESSION_ENDED' });
      return;
    }
  }

  const locallyCompleted =
    useOnboardingStore.getState().completed || (await getHasCompletedOnboarding().catch(() => false));
  const { destination, degraded } = resolvePostAuth({ serverCompleted, locallyCompleted });

  if (destination === '/(tabs)') {
    if (!degraded) {
      useOnboardingStore.getState().markCompleted();
      await setHasCompletedOnboarding(true);
    }
    if (degraded) {
      showToast({
        message: i18n.t('signup.toastSetupUnchecked'),
        tone: 'info',
      });
    }
    router.replace('/(tabs)' as Href);
    return;
  }
  if (degraded) {
    showToast({
      message: i18n.t('signup.toastServerUnreachable'),
      tone: 'info',
    });
  }
  navigate(destination);
}

// Inline legal links: footnote text is ~18pt tall, so a 14pt vertical hitSlop
// gives each link a ≥44pt effective target without reflowing the footer.
const LINK_HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 };

function LegalLink({ label, href }: { label: string; href: Href }) {
  return (
    <Pressable
      accessibilityRole="link"
      minTapTarget={false}
      hitSlop={LINK_HIT_SLOP}
      onPress={() => router.push(href)}
    >
      <Text variant="footnote" color={color.label} style={{ textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}

// Rendered in the scaffold's BOTTOM footer slot, not inline under the auth
// buttons. It used to sit immediately beneath them, where a real session
// mis-tapped it and landed on the Terms screen mid-flow (2026-08-08). The hit
// slop is unchanged — proximity to the primary CTA was the hazard, not size.
function LegalFooter() {
  const { t } = useTranslation();
  // The sentence is one locale key; each language places the links itself.
  const parts = t('signup.legalNotice', { terms: '{{terms}}', privacy: '{{privacy}}' })
    .split(/(\{\{terms\}\}|\{\{privacy\}\})/)
    .filter(Boolean);
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: space.xl,
      }}
    >
      {parts.map((part, i) =>
        part === '{{terms}}' ? (
          <LegalLink key={part} label={t('signup.legalTerms')} href={'/legal/terms' as Href} />
        ) : part === '{{privacy}}' ? (
          <LegalLink key={part} label={t('signup.legalPrivacy')} href={'/legal/privacy' as Href} />
        ) : (
          <Text key={i} variant="footnote" color={color.secondaryLabel}>
            {part}
          </Text>
        ),
      )}
    </View>
  );
}

// --- Real Clerk flows (rendered only when a key is configured) ----------------

// Clerk's error codes mapped to copy. Module scope: it only runs inside event
// handlers, so i18n.t reads the language current at that moment.
function clerkMessage(e: unknown): string {
  const err = e as { errors?: { message?: string; code?: string }[] };
  const first = err?.errors?.[0];
  if (first?.code === 'form_identifier_exists') return i18n.t('signup.errorEmailExists');
  if (first?.code === 'form_identifier_not_found') return i18n.t('signup.errorEmailNotFound');
  if (first?.code === 'form_code_incorrect') return i18n.t('signup.errorCodeIncorrect');
  return first?.message ?? i18n.t('signup.errorGeneric');
}

function ClerkSignup({ mode, setMode }: { mode: Mode; setMode: (next: Mode) => void }) {
  const { t } = useTranslation();
  const { dispatch } = useAppState();
  const { startSSOFlow } = useSSO();
  const { signUp, setActive: setActiveUp, isLoaded: upLoaded } = useSignUp();
  const { signIn, setActive: setActiveIn, isLoaded: inLoaded } = useSignIn();

  const [busy, setBusy] = useState<Provider | 'resend' | null>(null);
  const [stage, setStage] = useState<'buttons' | 'email' | 'code'>('buttons');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();
  const [emailAddressId, setEmailAddressId] = useState<string | undefined>();

  const sso = useCallback(
    async (provider: 'apple' | 'google') => {
      setBusy(provider);
      try {
        // redirectUrl is omitted — @clerk/clerk-expo derives it from the app
        // scheme (app.json "scheme"), which must match the Clerk dashboard.
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy: provider === 'apple' ? 'oauth_apple' : 'oauth_google',
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          await continueAfterAuth(dispatch);
          return;
        }
        // No session: the user cancelled or the flow needs extra steps.
        showToast({ message: t('signup.toastCancelled'), tone: 'info' });
      } catch (e) {
        showToast({ message: clerkMessage(e), tone: 'error' });
      } finally {
        setBusy(null);
      }
    },
    [startSSOFlow, dispatch, t],
  );

  // Asks Clerk to (re)send the email code. The first send and Resend share it.
  const prepareCode = useCallback(
    async (signInEmailId: string | undefined) => {
      if (mode === 'signup') {
        if (!signUp) throw new Error('auth not ready');
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        return;
      }
      if (!signIn || !signInEmailId) throw new Error('email code unavailable');
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: signInEmailId });
    },
    [mode, signUp, signIn],
  );

  // Email-code (OTP): request a code for sign-up or sign-in.
  const sendCode = useCallback(async () => {
    const addr = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) {
      setEmailError(t('signup.errorEmailInvalid'));
      return;
    }
    setEmailError(undefined);
    setBusy('email');
    try {
      if (mode === 'signup') {
        if (!upLoaded || !signUp) throw new Error('auth not ready');
        await signUp.create({ emailAddress: addr });
        await prepareCode(undefined);
      } else {
        if (!inLoaded || !signIn) throw new Error('auth not ready');
        const attempt = await signIn.create({ identifier: addr });
        const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
        const factorEmailId = factor && 'emailAddressId' in factor ? (factor.emailAddressId as string) : undefined;
        setEmailAddressId(factorEmailId);
        await prepareCode(factorEmailId);
      }
      setStage('code');
      showToast({ message: t('signup.toastCodeSent', { email: addr }), tone: 'info' });
    } catch (e) {
      showToast({ message: clerkMessage(e), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }, [email, mode, signUp, signIn, upLoaded, inLoaded, prepareCode, t]);

  const resendCode = useCallback(async () => {
    setCodeError(undefined);
    setBusy('resend');
    try {
      await prepareCode(emailAddressId);
      showToast({ message: t('signup.toastCodeSent', { email: email.trim().toLowerCase() }), tone: 'info' });
    } catch (e) {
      devWarn('[signup] resend failed:', e);
      setCodeError(t('signup.resendFailed'));
    } finally {
      setBusy(null);
    }
  }, [email, emailAddressId, prepareCode, t]);

  const verifyCode = useCallback(async () => {
    if (code.trim().length < 4) {
      setCodeError(t('signup.errorCodeEmpty'));
      return;
    }
    setCodeError(undefined);
    setBusy('email');
    try {
      if (mode === 'signup') {
        if (!signUp) throw new Error('auth not ready');
        const done = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (done.status !== 'complete' || !done.createdSessionId) throw new Error('verification incomplete');
        await setActiveUp({ session: done.createdSessionId });
      } else {
        if (!signIn) throw new Error('auth not ready');
        const done = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
        if (done.status !== 'complete' || !done.createdSessionId) throw new Error('verification incomplete');
        await setActiveIn({ session: done.createdSessionId });
      }
      await continueAfterAuth(dispatch);
    } catch (e) {
      showToast({ message: clerkMessage(e), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }, [code, mode, signUp, signIn, setActiveUp, setActiveIn, dispatch, t]);

  const anyBusy = busy !== null;

  return (
    <View style={{ gap: space.md }}>
      {stage === 'buttons' ? (
        <>
          <AppleSignInButton
            loading={busy === 'apple'}
            disabled={anyBusy && busy !== 'apple'}
            onPress={() => void sso('apple')}
          />
          <Button
            title={t('signup.continueGoogle')}
            icon="logo-google"
            variant="secondary"
            loading={busy === 'google'}
            disabled={anyBusy && busy !== 'google'}
            onPress={() => void sso('google')}
          />
          <Button
            title={t('signup.continueEmail')}
            variant="tertiary"
            disabled={anyBusy}
            onPress={() => setStage('email')}
          />
        </>
      ) : stage === 'email' ? (
        <>
          <TextField
            label={t('signup.emailLabel')}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setEmailError(undefined);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={() => void sendCode()}
            placeholder="you@example.com"
            error={emailError}
          />
          <Button title={t('signup.sendCode')} loading={busy === 'email'} onPress={() => void sendCode()} />
          <Button title={t('signup.back')} variant="tertiary" disabled={anyBusy} onPress={() => setStage('buttons')} />
        </>
      ) : (
        <>
          <Text variant="callout" color={color.secondaryLabel}>
            {t('signup.codePrompt', { email: email.trim() })}
          </Text>
          <TextField
            label={t('signup.codeLabel')}
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setCodeError(undefined);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            returnKeyType="go"
            onSubmitEditing={() => void verifyCode()}
            placeholder="123456"
            error={codeError}
          />
          <Button title={t('signup.verify')} loading={busy === 'email'} onPress={() => void verifyCode()} />
          <Button
            title={t('signup.resendCode')}
            variant="tertiary"
            loading={busy === 'resend'}
            disabled={anyBusy && busy !== 'resend'}
            onPress={() => void resendCode()}
          />
          <Button title={t('signup.differentEmail')} variant="tertiary" disabled={anyBusy} onPress={() => setStage('email')} />
        </>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={anyBusy}
        style={{ marginTop: space.sm }}
        onPress={() => {
          setMode(mode === 'signup' ? 'signin' : 'signup');
          setStage('buttons');
        }}
      >
        <Text variant="footnote" color={color.label} style={{ textAlign: 'center' }}>
          {mode === 'signup' ? t('signup.toggleToSignIn') : t('signup.toggleToSignUp')}
        </Text>
      </Pressable>
    </View>
  );
}

// --- Local dev auth mode (no Clerk key — Expo Go stays navigable) -------------

function DevSignup() {
  const { t } = useTranslation();
  const next = () => navigate('/onboarding/measurements');
  return (
    <View style={{ gap: space.md }}>
      <AppleSignInButton onPress={next} />
      <Button title={t('signup.continueGoogle')} icon="logo-google" variant="secondary" onPress={next} />
      <Button title={t('signup.continueEmail')} variant="tertiary" onPress={next} />
      <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
        {t('signup.devAuthMode')}
      </Text>
    </View>
  );
}

export default function SignupScreen() {
  const { t } = useTranslation();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(modeParam === 'signin' ? 'signin' : 'signup');
  return (
    <OnbScaffold
      step={7}
      title={mode === 'signin' ? t('signup.titleSignIn') : t('signup.titleSignUp')}
      footer={<LegalFooter />}
    >
      {isClerkEnabled() ? <ClerkSignup mode={mode} setMode={setMode} /> : <DevSignup />}
    </OnbScaffold>
  );
}
