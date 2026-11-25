// PHASE4_ROWS.md row 5 step 2b, Ask Lume (src/app/ai-query.tsx): a 429 with
// code ai_daily_limit_reached shows the server's message as an info toast
// (caught in useAIQuery, src/lib/data/aiBrain.ts) over the unavailable state.
// A plain 429 shows no toast and keeps the generic unavailable copy. The API
// and consent are mocked, so no network is called.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AIQueryScreen from '@/app/ai-query';
import { useToastStore } from '@/components/display/toastStore';
import { ApiError } from '@/lib/api';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

const mockQuery = jest.fn();
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    ...jest.requireActual('@/lib/api').api,
    ai: { query: (...args: unknown[]) => mockQuery(...args) },
  },
}));

jest.mock('@/lib/ai/consent', () => ({
  hasAiConsent: jest.fn(() => Promise.resolve(true)),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const LIMIT_MESSAGE = "You've used today's AI allowance. It resets at midnight UTC.";

async function sendQuestion(): Promise<string> {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );
  act(() => {
    const input = findAll(tree, (p) => typeof p.onChangeText === 'function')[0];
    (input.props.onChangeText as (v: string) => void)('protein?');
  });
  await act(async () => {
    const send = findAll(tree, (p) => p.accessibilityLabel === en.feedback.send)[0];
    (send.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
  return allText(tree);
}

beforeEach(() => {
  useToastStore.setState({ current: null });
});

test('the daily limit code shows the server message as an info toast', async () => {
  mockQuery.mockRejectedValue(new ApiError(429, LIMIT_MESSAGE, { code: 'ai_daily_limit_reached' }));

  const text = await sendQuestion();

  expect(useToastStore.getState().current).toMatchObject({ message: LIMIT_MESSAGE, tone: 'info' });
  expect(text).toContain(JSON.stringify(en.aiQuery.unavailableTitle));
});

test('a plain 429 shows no toast and keeps the generic unavailable message', async () => {
  mockQuery.mockRejectedValue(new ApiError(429, 'Too many requests'));

  const text = await sendQuestion();

  expect(useToastStore.getState().current).toBeNull();
  expect(text).toContain(JSON.stringify(en.aiQuery.unavailableMessage));
});
