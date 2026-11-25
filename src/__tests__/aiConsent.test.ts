// PHASE4_ROWS.md row 5: the consent helper behind the AI consent screen
// (src/lib/ai/consent.ts). acceptAiConsent records the server consent with
// POST /api/ai/consent before the device flag, hasAiConsent returns the stored
// choice, and a failed server call throws without setting the device flag. The
// api and the secure store are mocked; no network.
import { __resetAiConsentCache, acceptAiConsent, AI_CONSENT_KEY, hasAiConsent } from '@/lib/ai/consent';
import { api } from '@/lib/api';
import { getItem, setItem } from '@/lib/storage/secureStore';

jest.mock('@/lib/api', () => ({ api: { ai: { setConsent: jest.fn() } } }));

jest.mock('@/lib/storage/secureStore', () => ({
  getItem: jest.fn(),
  setItem: jest.fn().mockResolvedValue(true),
}));

const setConsent = api.ai.setConsent as jest.Mock;

beforeEach(() => {
  __resetAiConsentCache();
  setConsent.mockReset();
  (getItem as jest.Mock).mockReset();
  (setItem as jest.Mock).mockClear();
});

test('acceptAiConsent records the server consent, then the device flag', async () => {
  setConsent.mockResolvedValue({ consented: true });
  await acceptAiConsent();
  expect(setConsent).toHaveBeenCalledTimes(1);
  expect(setConsent).toHaveBeenCalledWith();
  expect(setItem).toHaveBeenCalledWith(AI_CONSENT_KEY, '1');
  expect(setConsent.mock.invocationCallOrder[0]).toBeLessThan((setItem as jest.Mock).mock.invocationCallOrder[0]);
  await expect(hasAiConsent()).resolves.toBe(true);
});

test('hasAiConsent returns the stored choice', async () => {
  setConsent.mockResolvedValue({ consented: true });
  (getItem as jest.Mock).mockResolvedValue('1');
  await expect(hasAiConsent()).resolves.toBe(true);

  __resetAiConsentCache();
  (getItem as jest.Mock).mockResolvedValue(null);
  await expect(hasAiConsent()).resolves.toBe(false);
});

test('a failed server call throws and leaves the device flag unset', async () => {
  (getItem as jest.Mock).mockResolvedValue(null);
  setConsent.mockRejectedValue(new Error('offline'));
  await expect(acceptAiConsent()).rejects.toThrow('offline');
  expect(setItem).not.toHaveBeenCalled();
  await expect(hasAiConsent()).resolves.toBe(false);
});
