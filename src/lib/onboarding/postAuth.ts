// Where an authenticated user goes next.
//
// "No onboarding record" and "the status request failed" are NOT the same
// thing. Conflating them silently re-onboarded an existing user whose network
// hiccupped: they were walked back through the entire flow and their answers
// re-submitted (audit 2026-08-08).
//
// Pure and dependency-free so the node suite can test it: signup.tsx pulls in
// @clerk/clerk-expo and expo-web-browser, which jest cannot mount.

export type PostAuthInput = {
  /** The server answered, and this is what it said. Undefined = it did not answer. */
  serverCompleted?: boolean;
  /** Local evidence this device already finished onboarding. */
  locallyCompleted: boolean;
  /** Steps 1 to 6 are answered on this device (goal and activity set). Signing
   *  in from Welcome skips them, so the flow must start at the goal step. */
  answered: boolean;
};

export type PostAuthDecision = {
  destination: '/(tabs)' | '/onboarding/measurements' | '/onboarding/goal';
  /** True when we are acting on local state because the server never answered. */
  degraded: boolean;
};

export function resolvePostAuth(input: PostAuthInput): PostAuthDecision {
  const flowStart = input.answered ? '/onboarding/measurements' : '/onboarding/goal';
  if (input.serverCompleted === true) {
    return { destination: '/(tabs)', degraded: false };
  }
  if (input.serverCompleted === false) {
    // Definitive: this account genuinely has no onboarding record.
    return { destination: flowStart, degraded: false };
  }
  // The check did not complete. Local evidence of a finished setup beats an
  // unanswered question — re-running onboarding is destructive to someone who
  // has already done it.
  return {
    destination: input.locallyCompleted ? '/(tabs)' : flowStart,
    degraded: true,
  };
}
