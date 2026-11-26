// Row 14b Fix 10: Thinking of leaving sends the chosen reason through the
// feedback API (the reason key only, no free text) and links Manage subscription
// to Apple's page. api, the subscription link and analytics are mocked.
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import LeavingScreen from '@/app/profile/leaving';
import { showToast } from '@/components/display/toastStore';
import type { FeedbackInput, RetentionSummary } from '@/lib/api';
import { track } from '@/lib/analytics';
import { openManageSubscription } from '@/lib/billing/subscriptionLinks';
import en from '@/lib/i18n/locales/en.json';
import { act, buttonWithTitle, findAll, renderScreen } from './helpers';

const mockFeedbackPost = jest.fn<Promise<{ id: string }>, [FeedbackInput]>();
jest.mock('@/lib/api', () => ({
  api: {
    retention: {
      summary: (): Promise<RetentionSummary> =>
        Promise.resolve({ meals_last_30_days: 3, workouts_last_30_days: 2, current_streak_days: 1 }),
    },
    feedback: { post: (input: FeedbackInput) => mockFeedbackPost(input) },
  },
}));
jest.mock('@/lib/billing/subscriptionLinks', () => ({
  isManageSubscriptionAvailable: () => true,
  openManageSubscription: jest.fn(),
}));
jest.mock('@/lib/analytics', () => ({ track: jest.fn() }));
jest.mock('@/components/display/toastStore', () => ({
  ...jest.requireActual('@/components/display/toastStore'),
  showToast: jest.fn(),
}));
jest.mock('@/components/display/LoadingSkeleton', () => ({ Skeleton: () => null }));

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};
const L = en.subscription.leaving;

const settle = () =>
  act(async () => {
    await new Promise((r) => setImmediate(r));
  });

async function render() {
  const tree = renderScreen(
    <SafeAreaProvider initialMetrics={METRICS}>
      <LeavingScreen />
    </SafeAreaProvider>,
  );
  await settle();
  return tree;
}

type Tree = Awaited<ReturnType<typeof render>>;

const send = (tree: Tree) => buttonWithTitle(tree, L.send)!;
const pick = (tree: Tree, label: string) =>
  act(async () => {
    findAll(tree, (p) => p.accessibilityLabel === label && p.accessibilityRole === 'checkbox')[0].props.onPress();
  });
const pressSend = (tree: Tree) =>
  act(async () => {
    send(tree).props.onPress();
  });

beforeEach(() => {
  mockFeedbackPost.mockReset();
  jest.mocked(showToast).mockClear();
  jest.mocked(track).mockClear();
  jest.mocked(openManageSubscription).mockReset();
});

afterEach(() => {
  // Nothing on this screen reaches analytics: no reason, no count, no name.
  expect(track).not.toHaveBeenCalled();
});

test('idle: Send reason is disabled until a reason is chosen', async () => {
  const tree = await render();
  expect(send(tree).props.disabled).toBe(true);
  await pick(tree, L.reasons.too_expensive);
  expect(send(tree).props.disabled).toBe(false);
});

test('submitting: the button shows loading while the reason is sent', async () => {
  mockFeedbackPost.mockReturnValue(new Promise(() => {}));
  const tree = await render();
  await pick(tree, L.reasons.not_using);
  await pressSend(tree);
  expect(send(tree).props.loading).toBe(true);
});

test('success: posts the reason key only, thanks the user and cannot send twice', async () => {
  mockFeedbackPost.mockResolvedValue({ id: 'f1' });
  const tree = await render();
  await pick(tree, L.reasons.missing_feature);
  await pressSend(tree);
  await settle();

  expect(mockFeedbackPost).toHaveBeenCalledTimes(1);
  expect(mockFeedbackPost).toHaveBeenCalledWith({ category: 'account', message: 'leaving_reason:missing_feature' });
  expect(showToast).toHaveBeenCalledWith({ message: L.sent, tone: 'success' });
  expect(send(tree).props.disabled).toBe(true);
});

test('error: says it could not send and lets the user try again', async () => {
  mockFeedbackPost.mockRejectedValue(new Error('offline'));
  const tree = await render();
  await pick(tree, L.reasons.other);
  await pressSend(tree);
  await settle();

  expect(showToast).toHaveBeenCalledWith({ message: L.sendFailed, tone: 'error' });
  expect(send(tree).props.disabled).toBe(false);
  expect(send(tree).props.loading).toBe(false);
});

test('Manage subscription opens Apple’s page, and says so when it cannot', async () => {
  const tree = await render();
  const manage = () =>
    act(async () => {
      buttonWithTitle(tree, en.subscription.manage)!.props.onPress();
    });

  jest.mocked(openManageSubscription).mockResolvedValue(true);
  await manage();
  expect(openManageSubscription).toHaveBeenCalledTimes(1);
  expect(showToast).not.toHaveBeenCalled();

  jest.mocked(openManageSubscription).mockResolvedValue(false);
  await manage();
  expect(showToast).toHaveBeenCalledWith({ message: en.profile.manageSubscriptionFailed, tone: 'error' });
});
