// Entry gate. Decides between the main tabs and the onboarding flow:
//   0. Clerk enabled and NOT signed in → onboarding (sign-in lives there),
//      regardless of any local flag. Pre-audit the decision consulted ONLY the
//      persisted onboarding flags, so a revoked session — or keychain flags
//      surviving a reinstall — dropped a signed-out user straight into the
//      tabs with every request 401ing (audit 2026-08-06).
//   1. Ask the backend (GET /api/onboarding, behind the entitlement gate). A
//      401 → the session is not valid: SESSION_ENDED ends the rejected Clerk
//      session and opens sign-in, keeping the onboarding answers. A 402 → no
//      plan grants access: the paywall, told the refusal reason, even when
//      this device already finished onboarding.
//   2. Otherwise the persisted onboarding store (or the legacy secure-store
//      flag) saying completed, or the server saying completed=true, → main
//      app. completed=false or a network error with no local flag →
//      onboarding.
// The onboarding flow lives at /onboarding (a stack above the tabs); once
// completed it never shows again.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

import { color } from '@/lib/design/tokens';
import { api, type ApiError } from '@/lib/api';
import { useAppState } from '@/lib/auth/appState';
import { classifyConnectivity } from '@/lib/auth/machine';
import { isClerkEnabled } from '@/lib/auth/clerkEnv';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { getHasCompletedOnboarding } from '@/lib/storage/secureStore';
import { resumeTarget } from '@/lib/onboarding/resume';

type Destination = string;

export default function Index() {
  // Hooks must be unconditional per component — split on Clerk availability
  // (isClerkEnabled() is fixed for the process lifetime, so the branch is
  // stable across renders).
  return isClerkEnabled() ? <ClerkGatedIndex /> : <FlagGatedIndex signedIn />;
}

// Rendered inside ClerkProvider+ClerkLoaded (see _layout's AuthGate), so
// isSignedIn is settled — no flash-of-wrong-screen.
function ClerkGatedIndex() {
  const { isSignedIn } = useAuth();
  return <FlagGatedIndex signedIn={isSignedIn === true} />;
}

function FlagGatedIndex({ signedIn }: { signedIn: boolean }) {
  const [destination, setDestination] = useState<Destination | null>(null);
  const { dispatch } = useAppState();

  useEffect(() => {
    let active = true;
    const decide = async () => {
      // Hydrate FIRST, before any branch reads the store. The signed-out
      // branch used to return ahead of this, so it could never consult the
      // persisted progress it was about to discard (audit 2026-08-08).
      if (!useOnboardingStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useOnboardingStore.persist.onFinishHydration(() => {
            unsub?.();
            resolve();
          });
        });
      }
      const store = useOnboardingStore.getState();

      if (!signedIn) {
        // No session → the local flags are someone else's history (reinstall,
        // revocation). Sign-in lives in the onboarding stack, but resume at
        // the step they reached rather than restarting the whole flow.
        if (active) setDestination(resumeTarget(store.last_step));
        return;
      }

      const locallyCompleted = store.completed || (await getHasCompletedOnboarding());

      try {
        const onboarding = await api.onboarding.get();
        if (onboarding.completed || locallyCompleted) {
          if (!locallyCompleted) store.markCompleted();
          if (active) setDestination('/(tabs)');
          return;
        }
      } catch (e) {
        // An expired session is a sign-in problem, not "not onboarded". The
        // machine clears it, routes to sign-in and shows the expired message.
        if (classifyConnectivity(e) === 'sessionExpired') {
          if (active) dispatch({ type: 'SESSION_ENDED' });
          return;
        }
        // The entitlement gate refused: show the paywall with the reason, not
        // the start of onboarding with no word of why.
        const { status, reason } = e as Partial<ApiError>;
        if (status === 402) {
          if (active) setDestination(reason ? `/onboarding/paywall?reason=${encodeURIComponent(reason)}` : '/onboarding/paywall');
          return;
        }
        // Backend unreachable → trust the local flag, else treat as not onboarded.
        if (locallyCompleted) {
          if (active) setDestination('/(tabs)');
          return;
        }
      }
      if (active) setDestination(resumeTarget(useOnboardingStore.getState().last_step));
    };
    void decide();
    return () => {
      active = false;
    };
  }, [signedIn, dispatch]);

  if (destination === null) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.black} />
      </View>
    );
  }

  // Cast: /onboarding is resolved by expo-router at runtime but isn't in the
  // generated typed-route union (same seam as @/lib/nav's string→Href cast).
  return <Redirect href={destination as Href} />;
}
