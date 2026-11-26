// Paywall screen (PHASE2_ROWS.md row 2) — EXECUTES the real screen, not a
// source-text grep. The purchases wrapper is mocked (no live store call is
// possible in this environment); isBillingEnabled is forced true so the real
// purchase CTA renders instead of the billing-disabled dev stub, since that is
// the path row 2 actually describes ("api.onboarding.post fires only at
// paywall.tsx"). paywallScreen.render.test.tsx covers each paywall state.
import PaywallScreen from '@/app/onboarding/paywall';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => true,
  TRIAL_DAYS: 7,
}));
jest.mock('@/lib/purchases/revenuecat', () => ({
  getOfferings: () =>
    Promise.resolve([
      {
        identifier: 'default',
        packages: [
          { identifier: '$rc_monthly', productId: 'monthly', priceString: '$9.99', periodLabel: 'Monthly', trialEligible: false },
        ],
      },
    ]),
}));
jest.mock('@/components/display/LoadingSkeleton', () => ({ SkeletonList: () => null }));

async function render() {
  const tree = renderScreen(<PaywallScreen />);
  await act(async () => new Promise((r) => setImmediate(r)));
  return tree;
}

test('renders without crashing', async () => {
  const tree = await render();
  expect(tree.toJSON()).not.toBeNull();
});

test('renders the primary purchase control', async () => {
  const tree = await render();
  const cta = buttonWithTitle(tree, en.onboarding.paywall.subscribe);
  expect(cta).toBeDefined();
  expect(cta!.props.disabled).toBeFalsy();
});

test('renders the restore purchases control', async () => {
  const tree = await render();
  expect(allText(tree)).toContain('Already subscribed? Restore purchases');
});
