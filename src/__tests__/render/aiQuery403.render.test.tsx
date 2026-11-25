// PHASE4_ROWS.md row 5b, Ask Lume (src/app/ai-query.tsx): when the server
// refuses with 403 ai_consent_required, the real ask() in
// src/lib/data/aiBrain.ts opens the consent screen instead of an alert and
// shows the permission message. ApiError is the real class because ask()
// checks the status with instanceof; no network is called.
import { router } from 'expo-router';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AIQueryScreen from '@/app/ai-query';
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

test('a 403 from the server opens /ai-consent and shows the permission message', async () => {
  const { ApiError } = jest.requireActual<typeof import('@/lib/api')>('@/lib/api');
  mockQuery.mockRejectedValueOnce(new ApiError(403, 'ai_consent_required'));

  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AIQueryScreen />
    </SafeAreaProvider>,
  );

  const input = findAll(tree, (p) => p.accessibilityLabel === 'Ask a question')[0];
  act(() => (input.props.onChangeText as (t: string) => void)("How's my protein this week?"));
  const send = findAll(tree, (p) => p.accessibilityLabel === 'Send')[0];
  await act(async () => {
    (send.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });

  expect(mockQuery).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/ai-consent');
  expect(allText(tree)).toContain('Ask Lume needs your permission');
});
