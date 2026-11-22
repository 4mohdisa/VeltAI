// PHASE3_ROWS.md row 10: the Help and feedback screen (src/app/profile/feedback.tsx).
// Send stays disabled until a category is chosen and the message has text; the
// device switch starts off, and the request body carries app_version and
// device_model only when it is on.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import FeedbackScreen from '@/app/profile/feedback';
import en from '@/lib/i18n/locales/en.json';
import { act, findAll, renderScreen } from './helpers';

const mockPost = jest.fn();

jest.mock('@/lib/api', () => ({
  api: { feedback: { post: (...args: unknown[]) => mockPost(...args) } },
}));

jest.mock('@/lib/appVersion', () => ({ VERSION_LABEL: '1.4.0 (12)' }));

jest.mock('expo-device', () => ({ modelName: 'iPhone 16 Pro' }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

beforeEach(() => {
  mockPost.mockReset().mockResolvedValue({ id: 'fb_1' });
});

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <FeedbackScreen />
    </SafeAreaProvider>,
  );
  await act(async () => {
    await new Promise((r) => setImmediate(r));
  });
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;

const byLabel = (tree: Tree, label: string, role?: string) =>
  findAll(tree, (p) => p.accessibilityLabel === label && (role === undefined || p.accessibilityRole === role))[0];

const sendButton = (tree: Tree) => byLabel(tree, en.feedback.send, 'button');
const deviceSwitch = (tree: Tree) => byLabel(tree, en.feedback.includeDevice, 'switch');

async function fill(tree: Tree, text: string) {
  await act(async () => {
    byLabel(tree, en.feedback.categoryBug, 'button').props.onPress();
  });
  await act(async () => {
    byLabel(tree, en.feedback.messageLabel).props.onChangeText(text);
  });
}

async function pressSend(tree: Tree) {
  await act(async () => {
    sendButton(tree).props.onPress();
  });
}

test('the screen renders its category options, message box, switch and Send button', async () => {
  const tree = await render();
  for (const label of [en.feedback.categoryBug, en.feedback.categoryIdea, en.feedback.categoryAccount, en.feedback.categoryOther]) {
    expect(byLabel(tree, label, 'button')).toBeDefined();
  }
  expect(byLabel(tree, en.feedback.messageLabel)).toBeDefined();
  expect(deviceSwitch(tree)).toBeDefined();
  expect(sendButton(tree)).toBeDefined();
});

test('Send is disabled with no category, even with text', async () => {
  const tree = await render();
  await act(async () => {
    byLabel(tree, en.feedback.messageLabel).props.onChangeText('The scan froze');
  });
  expect(sendButton(tree).props.accessibilityState.disabled).toBe(true);
});

test('Send is enabled with a category and text', async () => {
  const tree = await render();
  await fill(tree, 'The scan froze');
  expect(sendButton(tree).props.accessibilityState.disabled).toBe(false);
});

test('the device switch starts off and its hint is set', async () => {
  const node = deviceSwitch(await render());
  expect(node.props.value).toBe(false);
  expect(node.props.accessibilityHint).toBe(en.feedback.includeDeviceHint);
});

test('with the switch off, the request has only category and the trimmed message', async () => {
  const tree = await render();
  await fill(tree, '  The scan froze  ');
  await pressSend(tree);
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost.mock.calls[0][0]).toEqual({ category: 'bug', message: 'The scan froze' });
});

test('with the switch on, the request also has app_version and device_model', async () => {
  const tree = await render();
  await fill(tree, 'The scan froze');
  await act(async () => {
    deviceSwitch(tree).props.onValueChange(true);
  });
  await pressSend(tree);
  expect(mockPost.mock.calls[0][0]).toEqual({
    category: 'bug',
    message: 'The scan froze',
    app_version: '1.4.0 (12)',
    device_model: 'iPhone 16 Pro',
  });
});

test('a failed send keeps the typed text', async () => {
  mockPost.mockRejectedValueOnce(new Error('offline'));
  const tree = await render();
  await fill(tree, 'The scan froze');
  await pressSend(tree);
  expect(byLabel(tree, en.feedback.messageLabel).props.value).toBe('The scan froze');
});
