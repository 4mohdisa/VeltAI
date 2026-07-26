// Auth state machine — pure functions, no React, fully unit-testable.
//
// Every scenario in the Phase 13 table maps to a transition here. The runtime
// (AppStateProvider) feeds events in and executes the returned effects; nothing
// else in the app computes auth state.
//
//	States:  unknown → (cold start resolves) → signedOut | onboarding | signedIn
//	         signedIn → expired (token expiry) → signedIn (refresh ok) | signedOut
//	         signedIn → deleted (account deletion) → signedOut semantics + purge
export type AuthState = 'unknown' | 'signedOut' | 'signedIn' | 'onboarding' | 'expired' | 'deleted';

export type AuthEvent =
  // Cold start resolved with what the device knows.
  | { type: 'COLD_START'; hasSession: boolean; hasCompletedOnboarding: boolean }
  | { type: 'SIGNED_IN'; hasCompletedOnboarding: boolean }
  | { type: 'ONBOARDING_COMPLETED' }
  | { type: 'TOKEN_EXPIRED' } // detected mid-session (or foreground revalidation failed)
  | { type: 'REFRESH_SUCCEEDED' }
  | { type: 'REFRESH_FAILED' }
  | { type: 'UNAUTHORIZED' } // a request returned 401
  | { type: 'SIGN_OUT' }
  | { type: 'ACCOUNT_DELETED' }
  | { type: 'FOREGROUND_AFTER_IDLE' }; // backgrounded > 30 min

// Effects are instructions for the runtime — the machine never performs IO.
export type AuthEffect =
  | 'route:onboarding' //   send the user into the onboarding flow
  | 'route:app' //          send the user into the main app
  | 'route:signIn' //       send the user to sign-in
  | 'refreshToken' //       attempt a silent token refresh
  | 'retryFailedRequest' // after a 401→refresh success, replay the failed call
  | 'revalidateSession' //  silent validity check (foreground / cold start)
  | 'purgeAllState' //      clear every store + secure-store + offline queue
  | 'toast:sessionExpired';

export type Transition = { state: AuthState; effects: AuthEffect[] };

const stay = (state: AuthState): Transition => ({ state, effects: [] });

/**
 * transition maps (state, event) → (state, effects). Unknown combinations stay
 * put with no effects — an event arriving in a state it doesn't apply to is a
 * no-op, never a crash.
 */
export function transition(state: AuthState, event: AuthEvent): Transition {
  switch (event.type) {
    case 'COLD_START': {
      // Cold start resolves `unknown` (and re-resolves any state — e.g. a dev
      // reload) into the right lane.
      if (!event.hasSession) return { state: 'signedOut', effects: ['route:onboarding'] };
      if (!event.hasCompletedOnboarding) return { state: 'onboarding', effects: ['route:onboarding'] };
      // Signed in + onboarded → app immediately, validate silently in the background.
      return { state: 'signedIn', effects: ['route:app', 'revalidateSession'] };
    }

    case 'SIGNED_IN':
      return event.hasCompletedOnboarding
        ? { state: 'signedIn', effects: ['route:app'] }
        : { state: 'onboarding', effects: ['route:onboarding'] };

    case 'ONBOARDING_COMPLETED':
      return state === 'onboarding' ? { state: 'signedIn', effects: ['route:app'] } : stay(state);

    case 'TOKEN_EXPIRED':
      // Silent refresh first; only the refresh outcome decides sign-out.
      return state === 'signedIn' || state === 'onboarding'
        ? { state: 'expired', effects: ['refreshToken'] }
        : stay(state);

    case 'UNAUTHORIZED':
      // One refresh + retry; REFRESH_FAILED (below) is the sign-out path.
      return state === 'signedIn' || state === 'onboarding'
        ? { state: 'expired', effects: ['refreshToken'] }
        : stay(state);

    case 'REFRESH_SUCCEEDED':
      return state === 'expired'
        ? { state: 'signedIn', effects: ['retryFailedRequest'] }
        : stay(state);

    case 'REFRESH_FAILED':
      return state === 'expired'
        ? { state: 'signedOut', effects: ['purgeAllState', 'route:signIn', 'toast:sessionExpired'] }
        : stay(state);

    case 'SIGN_OUT':
      return { state: 'signedOut', effects: ['purgeAllState', 'route:signIn'] };

    case 'ACCOUNT_DELETED':
      // Same as sign-out plus: cached data must never be restored. The runtime
      // treats `deleted` exactly like signedOut for routing, but the state name
      // lets it hard-skip any hydration attempt.
      return { state: 'deleted', effects: ['purgeAllState', 'route:onboarding'] };

    case 'FOREGROUND_AFTER_IDLE':
      // Backgrounded >30 min → revalidate silently; TOKEN_EXPIRED follows if bad.
      return state === 'signedIn' ? { state, effects: ['revalidateSession'] } : stay(state);

    default:
      return stay(state);
  }
}

/** True when the UI should treat the user as inside the app. */
export function isAuthenticated(state: AuthState): boolean {
  // `expired` keeps the user in place while the silent refresh runs — the UI
  // must not bounce to sign-in unless the refresh actually fails.
  return state === 'signedIn' || state === 'expired';
}

/** True when cached user data may be hydrated/rendered. Deleted never hydrates. */
export function mayHydrateCachedData(state: AuthState): boolean {
  return state !== 'deleted' && state !== 'unknown';
}

// ---------------------------------------------------------------------------
// Network/server error classification (scenario: distinguish "no network" from
// "server unreachable" in error copy).
// ---------------------------------------------------------------------------

export type ConnectivityProblem = 'offline' | 'serverDown' | 'none';

/**
 * classifyConnectivity: a fetch TypeError with no response = device offline;
 * a 5xx response = server reachable but failing; anything else = not a
 * connectivity problem.
 */
export function classifyConnectivity(error: unknown, status?: number): ConnectivityProblem {
  if (status != null && status >= 500) return 'serverDown';
  if (error instanceof TypeError) return 'offline';
  return 'none';
}

/** User-facing copy for a connectivity problem. */
export function connectivityMessage(problem: ConnectivityProblem): string | null {
  switch (problem) {
    case 'offline':
      return "You're offline. Your changes are saved and will sync when you reconnect.";
    case 'serverDown':
      return "Lumo's servers are having trouble. Your data is safe — try again shortly.";
    default:
      return null;
  }
}
