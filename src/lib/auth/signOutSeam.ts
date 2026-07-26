// Sign-out executor seam. The machine's purge effect calls executeSignOut() so a
// machine-initiated sign-out (e.g. refresh failure) also ends the Clerk session,
// not just local state. The ClerkBridge registers the real executor; in local
// dev auth mode nothing is registered and this is a no-op.
let executor: (() => Promise<void>) | null = null;

export function registerSignOutExecutor(fn: (() => Promise<void>) | null): void {
  executor = fn;
}

/** End the provider session (best-effort; never throws). */
export async function executeSignOut(): Promise<void> {
  if (!executor) return;
  await executor().catch(() => undefined);
}
