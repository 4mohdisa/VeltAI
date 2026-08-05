// The mount point, and the only debug import in the app tree.
//
// It reads auth and entitlement from the app's own hooks and hands them to the
// debug root, so capture can record them without reaching into React from a
// shake handler or an unhandled rejection.
//
// Renders null when the flag is off, and in that build `DebugRoot` is already
// the stub (metro.config.js), so nothing under ./impl is bundled at all.
import { DEBUG_CAPTURE, DebugRoot } from './index';
import { useAppState } from '@/lib/auth/appState';
import { isAuthenticated } from '@/lib/auth/machine';
import { useEntitlement } from '@/lib/billing/entitlement';

export function DebugOverlay() {
  // Hooks must run unconditionally; the flag is a build-time constant, so the
  // whole component folds to `null` in a production bundle anyway.
  const { auth } = useAppState();
  const entitlement = useEntitlement();

  if (!DEBUG_CAPTURE) return null;

  return (
    <DebugRoot
      auth={{ signedIn: isAuthenticated(auth), userId: null }}
      entitlement={{ active: entitlement.isEntitled, status: entitlement.loading ? 'loading' : null }}
    />
  );
}
