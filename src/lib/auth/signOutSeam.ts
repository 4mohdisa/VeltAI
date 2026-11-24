// Sign-out executor seam. The machine's purge effect calls executeSignOut() so a
// machine-initiated sign-out (e.g. refresh failure) also ends the Clerk session,
// not just local state. The ClerkBridge registers the real executor; in local
// dev auth mode nothing is registered and this is a no-op.
//
// appSignOutPending lets the bridge tell this app-initiated sign-out apart from
// Clerk ending the session on its own (expiry, revocation).
let executor: (() => Promise<void>) | null = null;
let appSignOutPending = false;

export function registerSignOutExecutor(fn: (() => Promise<void>) | null): void {
  executor = fn;
}

/** End the provider session (best-effort; never throws). */
export async function executeSignOut(): Promise<void> {
  if (!executor) return;
  appSignOutPending = true;
  await executor().catch(() => undefined);
}

/** True once after executeSignOut ran; the call clears it. */
export function consumeAppSignOut(): boolean {
  const pending = appSignOutPending;
  appSignOutPending = false;
  return pending;
}
