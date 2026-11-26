// BillingProblemBanner (Row 8): shows only for the server's billing issue state
// (past_due); renders nothing for every other state and while no record has
// loaded. The entitlement hook, the refetch and the manage link are mocked;
// the banner never reaches the purchases wrapper or the RevenueCat SDK.
import { BillingProblemBanner } from '@/components/display/BillingProblemBanner';
import { showToast } from '@/components/display/toastStore';
import { openManageSubscription } from '@/lib/billing/subscriptionLinks';
import { hydrateSubscription } from '@/lib/data';
import { layout } from '@/lib/design/tokens';
import en from '@/lib/i18n/locales/en.json';
import type { ServerEntitlement } from '@/lib/settings/store';
import { act, allText, findAll, renderScreen } from './helpers';

let mockEntitlement: ServerEntitlement = null;
jest.mock('@/lib/data', () => ({
  useServerEntitlement: () => mockEntitlement,
  hydrateSubscription: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/billing/subscriptionLinks', () => ({ openManageSubscription: jest.fn() }));
jest.mock('@/lib/purchases/revenuecat', () => {
  throw new Error('the banner must not load the purchases wrapper');
});
jest.mock('@/components/display/toastStore', () => ({ showToast: jest.fn() }));

const b = en.subscription.billingProblem;

const button = (tree: ReturnType<typeof renderScreen>, label: string) =>
  findAll(tree, (q) => q.accessibilityLabel === label && typeof q.onPress === 'function')[0];

beforeEach(() => {
  jest.mocked(hydrateSubscription).mockClear();
  jest.mocked(openManageSubscription).mockReset().mockResolvedValue(true);
  jest.mocked(showToast).mockClear();
});

test.each([
  ['active', { isActive: true, status: 'active' }],
  ['trial', { isActive: true, status: 'trialing' }],
  ['expired', { isActive: false, status: 'expired' }],
  ['cancelled', { isActive: true, status: 'cancelled' }],
  ['loading (no record yet)', null],
])('%s renders nothing', (_label, entitlement) => {
  mockEntitlement = entitlement;
  expect(renderScreen(<BillingProblemBanner />).toJSON()).toBeNull();
});

describe('billing issue', () => {
  beforeEach(() => {
    mockEntitlement = { isActive: true, status: 'past_due' };
  });

  test('shows the message as an alert with two labelled 44 pt actions', () => {
    const tree = renderScreen(<BillingProblemBanner />);
    expect(allText(tree)).toContain(b.message);
    expect(findAll(tree, (q) => q.accessibilityRole === 'alert')).not.toHaveLength(0);
    for (const label of [b.manage, b.tryAgain]) {
      const host = findAll(tree, (q) => q.accessibilityLabel === label && q.accessibilityRole === 'button').at(-1)!;
      expect(host.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ minHeight: layout.tapTarget, minWidth: layout.tapTarget })]),
      );
    }
  });

  test('Manage subscription opens the existing Apple subscriptions link', async () => {
    const tree = renderScreen(<BillingProblemBanner />);
    await act(async () => (button(tree, b.manage).props.onPress as () => void)());
    expect(openManageSubscription).toHaveBeenCalledTimes(1);
    expect(showToast).not.toHaveBeenCalled();
  });

  test('Manage subscription that cannot open shows the existing failure message', async () => {
    jest.mocked(openManageSubscription).mockResolvedValue(false);
    const tree = renderScreen(<BillingProblemBanner />);
    await act(async () => (button(tree, b.manage).props.onPress as () => void)());
    expect(showToast).toHaveBeenCalledWith({ message: en.profile.manageSubscriptionFailed, tone: 'error' });
  });

  test('Try again refetches the subscription state', async () => {
    const tree = renderScreen(<BillingProblemBanner />);
    await act(async () => (button(tree, b.tryAgain).props.onPress as () => void)());
    expect(hydrateSubscription).toHaveBeenCalledTimes(1);
  });
});
