// AppStateProvider — the ONE owner of auth/network/sync status. Screens read
// from here (useAppState) and never compute auth state independently. The pure
// machine (machine.ts) decides transitions; this runtime executes the effects.
//
// Clerk isn't installed yet, so the session/refresh seams are injectable no-ops
// today (`configureAuthRuntime`) — the state flow, purge and routing behaviour
// are real and tested now, and Clerk drops into the seams later.
import type { JSX, ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AppState as RNAppState } from 'react-native';
import { router, type Href } from 'expo-router';

import {
  transition,
  type AuthEffect,
  type AuthEvent,
  type AuthState,
} from './machine';
import { resetAllStores } from './resetRegistry';
import { executeSignOut } from './signOutSeam';
import { showToast } from '@/components/display/toastStore';
import { subscribe as subscribeQueue } from '@/lib/offline/queue';

// --- Injectable runtime seams (Clerk lands here later) -----------------------

type AuthRuntime = {
  /** Attempt a silent token refresh. Resolve true on success. */
  refresh: () => Promise<boolean>;
  /** Silently validate the current session. Resolve true when still valid. */
  validate: () => Promise<boolean>;
};

let runtime: AuthRuntime = {
  refresh: async () => false, // no auth provider → refresh can't succeed
  validate: async () => true, // no provider → nothing to invalidate
};

export function configureAuthRuntime(r: AuthRuntime): void {
  runtime = r;
}

// --- Context ------------------------------------------------------------------

type AppStateValue = {
  auth: AuthState;
  pendingSync: number;
  dispatch: (event: AuthEvent) => void;
};

const Ctx = createContext<AppStateValue | null>(null);

/** Read the global app state. Throws when used outside the provider. */
export function useAppState(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState must be used inside <AppStateProvider>');
  return v;
}

// idleThresholdMs — background longer than this revalidates on foreground.
const idleThresholdMs = 30 * 60 * 1000;

type MachineSnapshot = { state: AuthState; effects: AuthEffect[] };

function reducer(snap: MachineSnapshot, event: AuthEvent): MachineSnapshot {
  const next = transition(snap.state, event);
  return { state: next.state, effects: next.effects };
}

export function AppStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const [snap, dispatch] = useReducer(reducer, { state: 'unknown', effects: [] });
  const [pendingSync, setPendingSync] = useReducer((_: number, n: number) => n, 0);
  const backgroundedAt = useRef<number | null>(null);

  // Execute effects AFTER the reducer commits (side-effects never run in render).
  const effectsKey = snap.effects.join(',');
  useEffect(() => {
    for (const effect of snap.effects) {
      switch (effect) {
        case 'purgeAllState':
          // Clear local state AND end the provider session (a machine-initiated
          // sign-out, e.g. refresh failure, must not leave a live Clerk session).
          void resetAllStores();
          void executeSignOut();
          break;
        case 'route:onboarding':
          router.replace('/onboarding' as Href);
          break;
        case 'route:app':
          router.replace('/(tabs)' as Href);
          break;
        case 'route:signIn':
          // Sign-in lives inside the onboarding flow until Clerk ships a
          // dedicated screen.
          router.replace('/onboarding/signup' as Href);
          break;
        case 'refreshToken':
          void runtime.refresh().then((ok) => dispatch({ type: ok ? 'REFRESH_SUCCEEDED' : 'REFRESH_FAILED' }));
          break;
        case 'revalidateSession':
          void runtime.validate().then((ok) => {
            if (!ok) dispatch({ type: 'TOKEN_EXPIRED' });
          });
          break;
        case 'toast:sessionExpired':
          showToast({ message: 'Your session expired — please sign in again.', tone: 'info' });
          break;
        case 'retryFailedRequest':
          // The API client owns retry (its 401 handler re-issues after refresh);
          // nothing to do at the app level.
          break;
      }
    }
    // effectsKey identifies the batch; snap.effects is stable per commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectsKey]);

  // Foreground-after-idle revalidation (scenario: backgrounded > 30 min).
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (next) => {
      if (next === 'background') backgroundedAt.current = Date.now();
      if (next === 'active' && backgroundedAt.current != null) {
        const idleMs = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (idleMs > idleThresholdMs) dispatch({ type: 'FOREGROUND_AFTER_IDLE' });
      }
    });
    return () => sub.remove();
  }, []);

  // Offline-queue depth (sync status).
  useEffect(() => subscribeQueue(setPendingSync), []);

  const value = useMemo<AppStateValue>(
    () => ({ auth: snap.state, pendingSync, dispatch }),
    [snap.state, pendingSync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
