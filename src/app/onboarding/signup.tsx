// Sign up / sign in — real Clerk auth (Apple + Google SSO, email-code OTP).
//
// DECISION: email uses the CODE (OTP) strategy, not passwords — fewer screens,
// no reset flow, and it doubles as verification. Sign-in and sign-up share the
// same OTP UI; "Already have an account?" toggles the mode.
//
// Post-auth the SCREEN owns routing (not the machine): the server's onboarding
// status is the truth (the local store is empty on a fresh install) — completed
// → straight to the app; otherwise the onboarding flow continues to
// measurements and submits via POST /api/onboarding at the end, exactly as
// before. With no Clerk key (local dev auth mode) the original stub behaviour
// remains so Expo Go stays fully navigable.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';

import { OnbScaffold } from '@/components/onboarding/OnbScaffold';
import { Button, TextField } from '@/components/forms';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { showToast } from '@/components/display/toastStore';
import { color, space } from '@/lib/design/tokens';
import { navigate } from '@/lib/nav';
import { isClerkEnabled } from '@/lib/auth/clerkEnv';
import { api } from '@/lib/api';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { setHasCompletedOnboarding } from '@/lib/storage/secureStore';

// Recommended by Clerk's Expo SSO docs: completes any pending auth session.
WebBrowser.maybeCompleteAuthSession();

type Provider = 'apple' | 'google' | 'email';

/** After a session is active: route by the SERVER's onboarding status. */
async function continueAfterAuth(): Promise<void> {
  try {
    const onboarding = await api.onboarding.get();
    if (onboarding.completed) {
      useOnboardingStore.getState().markCompleted();
      await setHasCompletedOnboarding(true);
      router.replace('/(tabs)' as Href);
      return;
    }
  } catch {
    // Unreachable backend → assume not onboarded; the flow re-checks later.
  }
  navigate('/onboarding/measurements');
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

function LegalFooter() {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: space.md,
      }}
    >
      <Text variant="footnote" color={color.secondaryLabel}>
        {'By continuing you agree to our '}
      </Text>
      <LegalLink label="Terms" href={'/legal/terms' as Href} />
      <Text variant="footnote" color={color.secondaryLabel}>
        {' and '}
      </Text>
      <LegalLink label="Privacy Policy" href={'/legal/privacy' as Href} />
    </View>
  );
}

// --- Real Clerk flows (rendered only when a key is configured) ----------------

function ClerkSignup() {
  const { startSSOFlow } = useSSO();
  const { signUp, setActive: setActiveUp, isLoaded: upLoaded } = useSignUp();
  const { signIn, setActive: setActiveIn, isLoaded: inLoaded } = useSignIn();

  const [busy, setBusy] = useState<Provider | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [stage, setStage] = useState<'buttons' | 'email' | 'code'>('buttons');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [codeError, setCodeError] = useState<string | undefined>();

  const clerkMessage = (e: unknown): string => {
    const err = e as { errors?: { message?: string; code?: string }[] };
    const first = err?.errors?.[0];
    if (first?.code === 'form_identifier_exists') return 'That email already has an account — try signing in instead.';
    if (first?.code === 'form_identifier_not_found') return "No account with that email — try signing up instead.";
    if (first?.code === 'form_code_incorrect') return "That code isn't right — check it and try again.";
    return first?.message ?? 'Something went wrong. Check your connection and try again.';
  };

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
          await continueAfterAuth();
          return;
        }
        // No session: the user cancelled or the flow needs extra steps.
        showToast({ message: 'Sign-in was cancelled.', tone: 'info' });
      } catch (e) {
        showToast({ message: clerkMessage(e), tone: 'error' });
      } finally {
        setBusy(null);
      }
    },
    [startSSOFlow],
  );

  // Email-code (OTP): request a code for sign-up or sign-in.
  const sendCode = useCallback(async () => {
    const addr = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);
    setBusy('email');
    try {
      if (mode === 'signup') {
        if (!upLoaded || !signUp) throw new Error('auth not ready');
        await signUp.create({ emailAddress: addr });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else {
        if (!inLoaded || !signIn) throw new Error('auth not ready');
        const attempt = await signIn.create({ identifier: addr });
        const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
        const emailAddressId = factor && 'emailAddressId' in factor ? (factor.emailAddressId as string) : undefined;
        if (!emailAddressId) throw new Error('email code unavailable');
        await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId });
      }
      setStage('code');
      showToast({ message: `Code sent to ${addr}.`, tone: 'info' });
    } catch (e) {
      showToast({ message: clerkMessage(e), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }, [email, mode, signUp, signIn, upLoaded, inLoaded]);

  const verifyCode = useCallback(async () => {
    if (code.trim().length < 4) {
      setCodeError('Enter the code from your email.');
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
      await continueAfterAuth();
    } catch (e) {
      showToast({ message: clerkMessage(e), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }, [code, mode, signUp, signIn, setActiveUp, setActiveIn]);

  const anyBusy = busy !== null;

  return (
    <View style={{ gap: space.md }}>
      {stage === 'buttons' ? (
        <>
          <Button
            title="Continue with Apple"
            icon="logo-apple"
            variant="primary"
            loading={busy === 'apple'}
            disabled={anyBusy && busy !== 'apple'}
            onPress={() => void sso('apple')}
          />
          <Button
            title="Continue with Google"
            icon="logo-google"
            variant="secondary"
            loading={busy === 'google'}
            disabled={anyBusy && busy !== 'google'}
            onPress={() => void sso('google')}
          />
          <Button
            title="Continue with email →"
            variant="tertiary"
            disabled={anyBusy}
            onPress={() => setStage('email')}
          />
        </>
      ) : stage === 'email' ? (
        <>
          <TextField
            label="Email"
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
          <Button title="Send code" loading={busy === 'email'} onPress={() => void sendCode()} />
          <Button title="Back" variant="tertiary" disabled={anyBusy} onPress={() => setStage('buttons')} />
        </>
      ) : (
        <>
          <Text variant="callout" color={color.secondaryLabel}>
            {`Enter the code we sent to ${email.trim()}`}
          </Text>
          <TextField
            label="Code"
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
          <Button title="Verify" loading={busy === 'email'} onPress={() => void verifyCode()} />
          <Button title="Use a different email" variant="tertiary" disabled={anyBusy} onPress={() => setStage('email')} />
        </>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={anyBusy}
        style={{ marginTop: space.sm }}
        onPress={() => {
          setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
          setStage('buttons');
        }}
      >
        <Text variant="footnote" color={color.label} style={{ textAlign: 'center' }}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'New to Lumo? Create an account'}
        </Text>
      </Pressable>

      <LegalFooter />
    </View>
  );
}

// --- Local dev auth mode (no Clerk key — Expo Go stays navigable) -------------

function DevSignup() {
  const next = () => navigate('/onboarding/measurements');
  return (
    <View style={{ gap: space.md }}>
      <Button title="Continue with Apple" icon="logo-apple" variant="primary" onPress={next} />
      <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={next} />
      <Button title="Continue with email →" variant="tertiary" onPress={next} />
      <Text variant="footnote" color={color.secondaryLabel} style={{ textAlign: 'center' }}>
        Local dev auth mode — no Clerk key configured
      </Text>
      <LegalFooter />
    </View>
  );
}

export default function SignupScreen() {
  return (
    <OnbScaffold step={6} title="Create your account">
      {isClerkEnabled() ? <ClerkSignup /> : <DevSignup />}
    </OnbScaffold>
  );
}
