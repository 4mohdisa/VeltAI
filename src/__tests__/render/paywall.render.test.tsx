// Paywall screen (PHASE2_ROWS.md row 2) — EXECUTES the real screen, not a
// source-text grep. RevenueCat's hosted paywall module is mocked (no live
// store call is possible in this environment); isBillingEnabled is forced
// true so the real purchase CTA renders instead of the billing-disabled dev
// stub, since that is the path row 2 actually describes ("api.onboarding.post
// fires only at paywall.tsx").
import PaywallScreen from '@/app/onboarding/paywall';
import { allText, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => true,
  presentPaywall: jest.fn().mockResolvedValue('cancelled'),
  restorePurchases: jest.fn().mockResolvedValue(null),
  hasProEntitlement: () => false,
  TRIAL_DAYS: 7,
}));

test('renders without crashing', () => {
  const tree = renderScreen(<PaywallScreen />);
  expect(tree.toJSON()).not.toBeNull();
});

test('renders the primary purchase control', () => {
  const tree = renderScreen(<PaywallScreen />);
  const cta = buttonWithTitle(tree, 'See plans & start free trial');
  expect(cta).toBeDefined();
  expect(cta!.props.disabled).toBeFalsy();
});

test('renders the restore purchases control', () => {
  const tree = renderScreen(<PaywallScreen />);
  expect(allText(tree)).toContain('Already subscribed? Restore purchases');
});
