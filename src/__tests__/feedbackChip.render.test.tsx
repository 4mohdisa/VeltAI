// PHASE4_ROWS.md row 14a, step 4: the thumbs chip
// (src/components/feedback/FeatureFeedbackChip.tsx). EXECUTES the real
// component and the real throttle; the prompt store is mocked so each test
// sets the loaded state and reads what was saved. The clock is fixed.
import { FeatureFeedbackChip } from '@/components/feedback/FeatureFeedbackChip';
import { loadFeedbackPromptState, saveFeedbackPromptState } from '@/lib/feedback/promptStore';
import { INITIAL_FEEDBACK_PROMPT_STATE, type FeedbackPromptState } from '@/lib/feedback/throttle';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './render/helpers';

jest.mock('@/lib/feedback/promptStore', () => ({
  loadFeedbackPromptState: jest.fn(),
  saveFeedbackPromptState: jest.fn(),
}));

const NOW = Date.UTC(2026, 10, 27, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const chip = en.feedback.chip;
const load = jest.mocked(loadFeedbackPromptState);
const save = jest.mocked(saveFeedbackPromptState);
const onRate = jest.fn();

const ready = (over: Partial<FeedbackPromptState> = {}): FeedbackPromptState => ({
  ...INITIAL_FEEDBACK_PROMPT_STATE,
  sessionCount: 2,
  ...over,
});

const flush = () => act(async () => new Promise((r) => setImmediate(r)));

async function render(state: FeedbackPromptState) {
  load.mockResolvedValue(state);
  const tree = renderScreen(<FeatureFeedbackChip featureKey="barcode_scan" onRate={onRate} />);
  await flush();
  return tree;
}

/** The pressable button VoiceOver announces with this label. */
const control = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && p.accessibilityRole === 'button' && typeof p.onPress === 'function')[0];

async function press(tree: ReturnType<typeof renderScreen>, label: string) {
  await act(async () => {
    (control(tree, label).props.onPress as () => void)();
  });
  await flush();
}

/** The state the chip saved: barcode_scan prompted at NOW. */
const savedPrompt = expect.objectContaining({
  lastPromptAt: NOW,
  lastPromptByFeature: expect.objectContaining({ barcode_scan: NOW }),
});

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  save.mockReset().mockResolvedValue(true);
  onRate.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows the question and labelled controls for a feature never prompted', async () => {
  const tree = await render(ready());
  expect(allText(tree)).toContain(chip.question);
  for (const label of [chip.thumbsUp, chip.thumbsDown, chip.dismiss]) {
    expect(control(tree, label)).toBeDefined();
  }
});

test('hidden when the feature was prompted within 30 days', async () => {
  const tree = await render(ready({ lastPromptByFeature: { barcode_scan: NOW - 29 * DAY } }));
  expect(tree.toJSON()).toBeNull();
});

test('hidden when the user chose not to be asked again', async () => {
  const tree = await render(ready({ dontAskAgain: ['barcode_scan'] }));
  expect(tree.toJSON()).toBeNull();
});

test.each([
  ['up', chip.thumbsUp],
  ['down', chip.thumbsDown],
] as const)('thumb %s saves a prompt record, calls onRate and hides', async (rating, label) => {
  const tree = await render(ready());
  await press(tree, label);
  expect(save).toHaveBeenCalledWith(savedPrompt);
  expect(onRate).toHaveBeenCalledWith(rating);
  expect(tree.toJSON()).toBeNull();
});

test('close saves a prompt record and hides without a rating', async () => {
  const tree = await render(ready());
  await press(tree, chip.dismiss);
  expect(save).toHaveBeenCalledWith(savedPrompt);
  expect(onRate).not.toHaveBeenCalled();
  expect(tree.toJSON()).toBeNull();
});

test('a rejected save still calls onRate', async () => {
  save.mockRejectedValue(new Error('storage unavailable'));
  const tree = await render(ready());
  await press(tree, chip.thumbsUp);
  expect(onRate).toHaveBeenCalledWith('up');
});
