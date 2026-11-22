// PHASE3_ROWS.md row 17 gap 5, Ask Lume (src/app/ai-query.tsx): an answer
// that is empty after trimming (only spaces or newlines) shows
// aiQueryAnswer.empty instead of a blank answer; a real answer does not show
// it. The AI hook and consent are mocked, so no network is called.
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

// Sends one question with ask() resolving to `result` while available.
async function sendWhileAvailable(result: string): Promise<string> {
  (useAIQuery as jest.Mock).mockReturnValue({ ask: jest.fn(() => Promise.resolve(result)), loading: false, unavailable: false });
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

test('an answer that is empty after trimming shows the empty-answer message', async () => {
  const text = await sendWhileAvailable('  \n ');

  expect(text).toContain(JSON.stringify(en.aiQueryAnswer.empty));
});

test('a non-empty answer does not show the empty-answer message', async () => {
  const text = await sendWhileAvailable('Your protein is on track this week.');

  expect(text).toContain(JSON.stringify('Your protein is on track this week.'));
  expect(text).not.toContain(JSON.stringify(en.aiQueryAnswer.empty));
});
