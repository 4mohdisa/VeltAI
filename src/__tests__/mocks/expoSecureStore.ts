// In-memory stand-in for expo-secure-store under jest (the native module has no
// node implementation). Backs the zustand persist adapter in tests.
const store = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return store.has(key) ? (store.get(key) as string) : null;
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}
export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}
// Test helper (not part of the real module) to reset between tests.
export function __reset(): void {
  store.clear();
}
