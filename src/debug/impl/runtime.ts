// Snapshots the capture needs but must not reach into React for.
//
// Auth and entitlement live in hooks/providers. A capture can fire from a shake
// or an unhandled rejection — outside any component — so the debug root pushes
// the current values in here and capture reads them synchronously. Plain module
// state, no subscription, no extra render.
type AuthSnapshot = { signedIn: boolean; userId: string | null };
type EntitlementSnapshot = { active: boolean | null; status: string | null };

let auth: AuthSnapshot = { signedIn: false, userId: null };
let entitlement: EntitlementSnapshot = { active: null, status: null };

export const setDebugAuthSnapshot = (s: AuthSnapshot): void => {
  auth = s;
};
export const getDebugAuthSnapshot = (): AuthSnapshot => auth;

export const setDebugEntitlementSnapshot = (s: EntitlementSnapshot): void => {
  entitlement = s;
};
export const getDebugEntitlementSnapshot = (): EntitlementSnapshot => entitlement;
