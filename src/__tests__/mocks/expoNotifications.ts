// expo-notifications for the node-env jest project. The real package is ESM and
// is not in transformIgnorePatterns, so importing it from a node test throws
// "Cannot use import statement outside a module". It reached the node suites
// when the sign-out purge (src/lib/auth/resetRegistry.ts) began clearing
// reminders through src/lib/notifications/device.ts. Only the members device.ts
// and permissions.ts call; scheduled notifications live in memory.
export const PermissionStatus = { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' } as const;
export const SchedulableTriggerInputTypes = { DATE: 'date' } as const;

const scheduled = new Map<string, unknown>();

export async function getPermissionsAsync() {
  return { status: PermissionStatus.UNDETERMINED, granted: false };
}
export async function requestPermissionsAsync() {
  return { status: PermissionStatus.DENIED, granted: false };
}
export async function getAllScheduledNotificationsAsync() {
  return [...scheduled].map(([identifier, request]) => ({ identifier, ...(request as object) }));
}
export async function scheduleNotificationAsync(request: { identifier: string }): Promise<string> {
  scheduled.set(request.identifier, request);
  return request.identifier;
}
export async function cancelScheduledNotificationAsync(identifier: string): Promise<void> {
  scheduled.delete(identifier);
}
// Test helper (not part of the real module) to reset between tests.
export function __reset(): void {
  scheduled.clear();
}
