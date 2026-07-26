// ClerkBridge — the runtime glue between Clerk and everything Phase 13 built.
// Rendered INSIDE ClerkProvider AND AppStateProvider (hooks from both), only
// when a Clerk key is configured. It:
//   1. registers the API client's token provider + 401 forced-refresh handler
//   2. registers the machine's refresh/validate runtime (configureAuthRuntime)
//   3. registers the sign-out executor (machine-initiated sign-outs end the
//      Clerk session too)
//   4. observes isSignedIn and drives the machine's SIGNED_IN / SIGN_OUT events
//   5. ties RevenueCat identity to the Clerk user id (logIn / logOut)
// Clerk is the source of truth for identity; the machine derives app state.
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { setAuthTokenProvider, setTokenRefreshHandler, setUnauthorizedHandler } from '@/lib/api';
import { onAuthUserChanged } from '@/lib/billing/purchases';
import { useAppState, configureAuthRuntime } from './appState';
import { registerSignOutExecutor } from './signOutSeam';

export function ClerkBridge(): null {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { dispatch } = useAppState();
  const prevSignedIn = useRef<boolean | null>(null);

  // Seams that don't depend on auth state — register once per getToken identity.
  useEffect(() => {
    setAuthTokenProvider(() => getToken().catch(() => null));
    setTokenRefreshHandler(() => getToken({ skipCache: true }).catch(() => null));
    setUnauthorizedHandler(() => dispatch({ type: 'UNAUTHORIZED' }));
    configureAuthRuntime({
      refresh: async () => (await getToken({ skipCache: true }).catch(() => null)) != null,
      validate: async () => (await getToken().catch(() => null)) != null,
    });
    registerSignOutExecutor(() => signOut().then(() => undefined));
    return () => {
      setTokenRefreshHandler(null);
      registerSignOutExecutor(null);
    };
  }, [getToken, signOut, dispatch]);

  // Identity transitions. NOTE deliberate asymmetry (see DECISIONS): the signup
  // screen owns post-SIGN-IN routing (it checks the server's onboarding status —
  // the local store is empty on a fresh install), so the bridge does NOT dispatch
  // SIGNED_IN; it only reports the RevenueCat identity and detects sign-OUT
  // (session ended by the user or revoked remotely) → machine purge + routing.
  useEffect(() => {
    if (!isLoaded) return;
    const was = prevSignedIn.current;
    prevSignedIn.current = isSignedIn;

    if (isSignedIn) {
      void onAuthUserChanged(userId ?? null);
      return;
    }
    void onAuthUserChanged(null);
    if (was === true) dispatch({ type: 'SIGN_OUT' });
  }, [isLoaded, isSignedIn, userId, dispatch]);

  return null;
}
