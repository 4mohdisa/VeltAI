// Auth state machine — one test per scenario row in the Phase 13 table, plus the
// helpers. Pure functions, no React.
import {
  transition,
  isAuthenticated,
  mayHydrateCachedData,
  classifyConnectivity,
  connectivityMessage,
  type AuthState,
} from '@/lib/auth/machine';

describe('scenario table', () => {
  test('cold start, signed out → onboarding', () => {
    const t = transition('unknown', { type: 'COLD_START', hasSession: false, hasCompletedOnboarding: false });
    expect(t.state).toBe('signedOut');
    expect(t.effects).toContain('route:onboarding');
  });

  test('cold start, signed in + onboarded → app with silent validation', () => {
    const t = transition('unknown', { type: 'COLD_START', hasSession: true, hasCompletedOnboarding: true });
    expect(t.state).toBe('signedIn');
    expect(t.effects).toEqual(expect.arrayContaining(['route:app', 'revalidateSession']));
  });

  test('cold start, signed in, NOT onboarded → resume onboarding', () => {
    const t = transition('unknown', { type: 'COLD_START', hasSession: true, hasCompletedOnboarding: false });
    expect(t.state).toBe('onboarding');
    expect(t.effects).toContain('route:onboarding');
  });

  test('token expired mid-session → silent refresh, NOT sign-out', () => {
    const t = transition('signedIn', { type: 'TOKEN_EXPIRED' });
    expect(t.state).toBe('expired');
    expect(t.effects).toEqual(['refreshToken']);
    expect(isAuthenticated(t.state)).toBe(true); // user stays in place during refresh
  });

  test('refresh succeeds → back to signedIn + retry the failed request', () => {
    const t = transition('expired', { type: 'REFRESH_SUCCEEDED' });
    expect(t.state).toBe('signedIn');
    expect(t.effects).toContain('retryFailedRequest');
  });

  test('refresh fails → sign out, purge, session-expired toast', () => {
    const t = transition('expired', { type: 'REFRESH_FAILED' });
    expect(t.state).toBe('signedOut');
    expect(t.effects).toEqual(expect.arrayContaining(['purgeAllState', 'route:signIn', 'toast:sessionExpired']));
  });

  test('401 on any request → one refresh attempt', () => {
    const t = transition('signedIn', { type: 'UNAUTHORIZED' });
    expect(t.state).toBe('expired');
    expect(t.effects).toEqual(['refreshToken']);
  });

  test('sign out → purge everything + sign-in route', () => {
    const t = transition('signedIn', { type: 'SIGN_OUT' });
    expect(t.state).toBe('signedOut');
    expect(t.effects).toEqual(expect.arrayContaining(['purgeAllState', 'route:signIn']));
  });

  test('account deleted → purge + never hydrate cached data', () => {
    const t = transition('signedIn', { type: 'ACCOUNT_DELETED' });
    expect(t.state).toBe('deleted');
    expect(t.effects).toContain('purgeAllState');
    expect(mayHydrateCachedData(t.state)).toBe(false);
  });

  test('foreground after >30 min idle → revalidate silently', () => {
    const t = transition('signedIn', { type: 'FOREGROUND_AFTER_IDLE' });
    expect(t.state).toBe('signedIn'); // no visible change unless validation fails
    expect(t.effects).toEqual(['revalidateSession']);
  });

  test('onboarding completed → app', () => {
    const t = transition('onboarding', { type: 'ONBOARDING_COMPLETED' });
    expect(t.state).toBe('signedIn');
    expect(t.effects).toContain('route:app');
  });

  test('sign-in resolves onboarding status', () => {
    expect(transition('signedOut', { type: 'SIGNED_IN', hasCompletedOnboarding: true }).state).toBe('signedIn');
    expect(transition('signedOut', { type: 'SIGNED_IN', hasCompletedOnboarding: false }).state).toBe('onboarding');
  });
});

describe('irrelevant events are safe no-ops', () => {
  const states: AuthState[] = ['unknown', 'signedOut', 'signedIn', 'onboarding', 'expired', 'deleted'];
  test('REFRESH_SUCCEEDED outside expired changes nothing', () => {
    for (const s of states.filter((s) => s !== 'expired')) {
      const t = transition(s, { type: 'REFRESH_SUCCEEDED' });
      expect(t.state).toBe(s);
      expect(t.effects).toEqual([]);
    }
  });
  test('TOKEN_EXPIRED while signed out changes nothing', () => {
    const t = transition('signedOut', { type: 'TOKEN_EXPIRED' });
    expect(t.state).toBe('signedOut');
    expect(t.effects).toEqual([]);
  });
});

describe('connectivity classification (no-network vs server-down copy)', () => {
  test('fetch TypeError → offline', () => {
    expect(classifyConnectivity(new TypeError('Network request failed'))).toBe('offline');
    expect(connectivityMessage('offline')).toMatch(/offline/i);
  });
  test('5xx → server down (distinct copy)', () => {
    expect(classifyConnectivity(new Error('x'), 503)).toBe('serverDown');
    expect(connectivityMessage('serverDown')).toMatch(/servers/i);
  });
  test('4xx / app errors → not a connectivity problem', () => {
    expect(classifyConnectivity(new Error('bad'), 400)).toBe('none');
    expect(connectivityMessage('none')).toBeNull();
  });
});
