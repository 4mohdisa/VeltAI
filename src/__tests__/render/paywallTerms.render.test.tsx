// Paywall subscription terms (PHASE4_ROWS.md row 14). EXECUTES the real screen:
// the auto-renew and Apple ID cancel text sit next to the purchase, with links
// to Terms and Privacy. The purchases wrapper is mocked as in paywall.render.test.tsx.
import { router } from 'expo-router';

import PaywallScreen from '@/app/onboarding/paywall';
import en from '@/lib/i18n/locales/en.json';
import { act, allText, findAll, renderScreen } from './helpers';

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

test('shows the auto-renew, Apple ID cancel and price terms', async () => {
  const text = allText(await render());
  expect(text).toContain(en.paywall.terms.autoRenew);
  expect(text).toContain(en.paywall.terms.cancel);
  expect(text).toContain(en.paywall.terms.price);
});

test('links to Terms and Privacy', async () => {
  const tree = await render();
  const links = findAll(tree, (p) => p.accessibilityRole === 'link');
  const labelled = (label: string) => links.find((n) => n.findAll((c) => c.props.children === label).length > 0);

  act(() => (labelled(en.signup.legalTerms)!.props.onPress as () => void)());
  act(() => (labelled(en.signup.legalPrivacy)!.props.onPress as () => void)());

  expect(router.push).toHaveBeenCalledWith('/legal/terms');
  expect(router.push).toHaveBeenCalledWith('/legal/privacy');
});
