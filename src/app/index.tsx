// Entry gate. Decides between the main tabs and the onboarding flow:
//   0. Clerk enabled and NOT signed in → onboarding (sign-in lives there),
//      regardless of any local flag. Pre-audit the decision consulted ONLY the
//      persisted onboarding flags, so a revoked session — or keychain flags
//      surviving a reinstall — dropped a signed-out user straight into the
//      tabs with every request 401ing (audit 2026-08-06).
//   1. If the persisted onboarding store (or the legacy secure-store flag) says
//      completed → main app.
//   2. Otherwise ask the backend (GET /api/onboarding). completed=true → mark
//      the store and proceed; completed=false or a network/401 error → onboarding.
// The onboarding flow lives at /onboarding (a stack above the tabs); once
// completed it never shows again.
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

import { color } from '@/lib/design/tokens';
import { api } from '@/lib/api';
import { isClerkEnabled } from '@/lib/auth/clerkEnv';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { getHasCompletedOnboarding } from '@/lib/storage/secureStore';

type Destination = '/(tabs)' | '/onboarding';

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

  useEffect(() => {
    let active = true;
    const decide = async () => {
      if (!signedIn) {
        // No session → the local flags are someone else's history (reinstall,
        // revocation). Sign-in lives in the onboarding stack.
        if (active) setDestination('/onboarding');
        return;
      }
      const store = useOnboardingStore.getState();

      // Wait for the persisted store to finish hydrating so we don't flash
      // onboarding at a returning user whose `completed` hasn't loaded yet.
      if (!useOnboardingStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useOnboardingStore.persist.onFinishHydration(() => {
            unsub?.();
            resolve();
          });
        });
      }

      if (useOnboardingStore.getState().completed || (await getHasCompletedOnboarding())) {
        if (active) setDestination('/(tabs)');
        return;
      }

      try {
        const onboarding = await api.onboarding.get();
        if (onboarding.completed) {
          store.markCompleted();
          if (active) setDestination('/(tabs)');
          return;
        }
      } catch {
        // Backend unreachable / not signed in → treat as not onboarded.
      }
      if (active) setDestination('/onboarding');
    };
    void decide();
    return () => {
      active = false;
    };
  }, [signedIn]);

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
