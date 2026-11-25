// PHASE4_ROWS.md row 5b: the existing one-time AI disclosure alert
// (ensureAiConsent in src/lib/ai/consent.ts) after the device-flag write moved
// into a helper shared with the consent screen. The alert asks the same
// question, Continue writes the same device flag, calls the same server route
// and turns analytics on; Not now records nothing.
import { Alert, type AlertButton } from 'react-native';

import { AI_CONSENT_KEY, __resetAiConsentCache, ensureAiConsent } from '@/lib/ai/consent';
import { api } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { useSettingsStore } from '@/lib/settings/store';
import { setItem } from '@/lib/storage/secureStore';

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('@/lib/api', () => ({ api: { ai: { setConsent: jest.fn() } } }));
jest.mock('@/lib/storage/secureStore', () => ({
  ...jest.requireActual('@/lib/storage/secureStore'),
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(true),
}));

const alert = Alert.alert as jest.Mock;
const setConsent = api.ai.setConsent as jest.Mock;

beforeEach(() => {
  __resetAiConsentCache();
  alert.mockClear();
  setConsent.mockReset().mockResolvedValue({ consented: true });
  (setItem as jest.Mock).mockClear();
  useSettingsStore.setState({ analyticsEnabled: false });
});

async function answer(text: string): Promise<boolean> {
  const result = ensureAiConsent();
  await new Promise((r) => setImmediate(r));
  const [title, body, buttons] = alert.mock.calls[0] as [string, string, AlertButton[]];
  expect(title).toBe(en.aiConsent.title);
  expect(body).toBe(en.aiConsent.body);
  buttons.find((b) => b.text === text)?.onPress?.();
  return result;
}

test('Continue writes the device flag, records the server consent and turns analytics on', async () => {
  await expect(answer(en.aiConsent.continue)).resolves.toBe(true);
  expect(setItem).toHaveBeenCalledWith(AI_CONSENT_KEY, '1');
  expect(setConsent).toHaveBeenCalledTimes(1);
  expect(useSettingsStore.getState().analyticsEnabled).toBe(true);

  await expect(ensureAiConsent()).resolves.toBe(true);
  expect(alert).toHaveBeenCalledTimes(1);
});

test('Not now records nothing', async () => {
  await expect(answer(en.aiConsent.notNow)).resolves.toBe(false);
  expect(setItem).not.toHaveBeenCalled();
  expect(setConsent).not.toHaveBeenCalled();
  expect(useSettingsStore.getState().analyticsEnabled).toBe(false);
});
