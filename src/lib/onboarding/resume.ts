// Where an unfinished onboarding resumes.
//
// The onboarding store persists the ANSWERS and, since the 2026-08-08 agent
// run, the user's POSITION (`last_step`). Before that, a reload sent everyone
// back to Welcome no matter how far they had got — the answers were still on
// disk, but the flow looked as though it had discarded them.
//
// Pure and dependency-free so it is testable in the node suite: the launch
// gate that uses it (src/app/index.tsx) pulls in Clerk, which jest cannot
// parse in that environment.
export const ONBOARDING_ROOT = '/onboarding';

export function resumeTarget(lastStep: string | null | undefined): string {
  if (!lastStep) return ONBOARDING_ROOT;
  // Only ever resume INTO the onboarding stack. A stale pointer at a route
  // that has since moved (or at a screen outside the flow) restarts cleanly
  // rather than pushing something that may no longer exist.
  if (!lastStep.startsWith(`${ONBOARDING_ROOT}/`)) return ONBOARDING_ROOT;
  return lastStep;
}
