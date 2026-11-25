// PHASE4_ROWS.md row 5b, Ask Lume (src/app/ai-query.tsx): when the server
// refuses with 403 ai_consent_required, the real ask() in
// src/lib/data/aiBrain.ts opens the consent screen instead of an alert and
// shows the permission message. ApiError is the real class because ask()
// checks the status with instanceof; no network is called.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AIQueryScreen from '@/app/ai-query';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockQuery = jest.fn();
jest.mock('@/lib/api', () => ({
  ApiError: jest.requireActual<typeof import('@/lib/api')>('@/lib/api').ApiError,
  api: { ai: { query: (...args: unknown[]) => mockQuery(...args) } },
}));

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/billing/upgradePrompt', () => ({
  handleUpgradeRequired: jest.fn(() => Promise.resolve(false)),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const { ApiError } = jest.requireActual<typeof import('@/lib/api')>('@/lib/api');

beforeEach(() => mockQuery.mockReset());

async function send(tree: ReturnType<typeof renderScreen>, question: string): Promise<void> {
  const input = findAll(tree, (p) => p.accessibilityLabel === 'Ask a question')[0];
  act(() => (input.props.onChangeText as (t: string) => void)(question));
  const button = findAll(tree, (p) => p.accessibilityLabel === 'Send')[0];
  await act(async () => {
    (button.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

const render = () =>
  renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );

test('a 403 from the server opens /ai-consent and shows the permission message', async () => {
  mockQuery.mockRejectedValueOnce(new ApiError(403, 'ai_consent_required'));

  const tree = render();
  await send(tree, "How's my protein this week?");

  expect(mockQuery).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/ai-consent');
  expect(allText(tree)).toContain(en.aiQuery.consentNeeded);
});

test('after consent is accepted, asking again shows the answer and does not reopen /ai-consent', async () => {
  mockQuery
    .mockRejectedValueOnce(new ApiError(403, 'ai_consent_required'))
    .mockResolvedValueOnce({ state: 'ok', answer: 'Your protein is on track this week.' });

  const tree = render();
  await send(tree, "How's my protein this week?");
  expect(router.push).toHaveBeenCalledTimes(1);

  await send(tree, "How's my protein this week?");

  expect(mockQuery).toHaveBeenCalledTimes(2);
  expect(router.push).toHaveBeenCalledTimes(1);
  expect(allText(tree)).toContain('Your protein is on track this week.');
  expect(allText(tree)).not.toContain(en.aiQuery.consentNeeded);
});
