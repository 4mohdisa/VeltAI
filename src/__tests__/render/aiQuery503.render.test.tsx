// PHASE3_ROWS.md row 17 gap 4, Ask Lume (src/app/ai-query.tsx): on a 503,
// ask() (src/lib/data/aiBrain.ts) returns the server's own explanation and
// sets unavailable; the screen shows that text under the unavailable title
// instead of the generic message. Any other failure returns '' and keeps the
// generic copy. The AI hook and consent are mocked, so no network is called.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import AIQueryScreen from '@/app/ai-query';
import { useAIQuery } from '@/lib/data/aiBrain';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

jest.mock('@/lib/ai/consent', () => ({
  ensureAiConsent: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/data/aiBrain', () => ({
  useAIQuery: jest.fn(),
}));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

const SERVER_503 = 'Could not verify your subscription. Try again shortly.';

// Sends one question with ask() resolving to `result` while unavailable.
async function sendWhileUnavailable(result: string): Promise<string> {
  (useAIQuery as jest.Mock).mockReturnValue({ ask: jest.fn(() => Promise.resolve(result)), loading: false, unavailable: true });
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

test('a 503 shows the message ask() returned under the unavailable title', async () => {
  const text = await sendWhileUnavailable(SERVER_503);

  expect(text).toContain(JSON.stringify(SERVER_503));
  expect(text).toContain(JSON.stringify(en.aiQuery.unavailableTitle));
  expect(text).not.toContain(JSON.stringify(en.aiQuery.unavailableMessage));
});

test('any other failure keeps the generic unavailable message', async () => {
  const text = await sendWhileUnavailable('');

  expect(text).toContain(JSON.stringify(en.aiQuery.unavailableTitle));
  expect(text).toContain(JSON.stringify(en.aiQuery.unavailableMessage));
});
