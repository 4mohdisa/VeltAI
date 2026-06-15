// Ordered onboarding routes (A1–A19) and helpers for progress + next-step
// navigation. Step numbers are 1-based (A1 = step 1).
export const ONBOARDING_ROUTES = [
  'welcome', //       A1
  'value-prop', //    A2
  'auth', //          A3
  'struggles', //     A4
  'past-attempts', // A5
  'frustrations', //  A6
  'reflection', //    A7
  'goal', //          A8
  'why', //           A9
  'body', //          A10
  'schedule', //      A11
  'gym', //           A12
  'eating', //        A13
  'cuisines', //      A14
  'wow', //           A15
  'lockout', //       A16
  'permissions', //   A17
  'paywall', //       A18
  'generating', //    A19
] as const;

export const ONBOARDING_TOTAL = ONBOARDING_ROUTES.length;

export function onboardingHref(name: string): string {
  return `/(onboarding)/${name}`;
}

/** The route for the step that follows `step` (1-based), or null at the end. */
export function nextOnboardingRoute(step: number): string | null {
  if (step >= ONBOARDING_ROUTES.length) return null;
  return onboardingHref(ONBOARDING_ROUTES[step]);
}
