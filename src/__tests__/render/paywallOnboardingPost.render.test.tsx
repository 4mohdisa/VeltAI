// Paywall → onboarding POST (PHASE2_ROWS.md row 2) — EXECUTES the real
// screen's purchase CTA, not just its render. Row 2's own API column says
// `api.onboarding.post` fires only at paywall.tsx; paywall.render.test.tsx
// only checks that the screen renders, never that pressing the CTA posts.
// This presses it. The RevenueCat purchase module is mocked (no live store
// call is possible here); `@/lib/api` is mocked so no live network call is
// possible either.
import PaywallScreen from '@/app/onboarding/paywall';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { act, buttonWithTitle, renderScreen } from './helpers';

jest.mock('@/lib/billing/purchases', () => ({
  isBillingEnabled: () => true,
  presentPaywall: jest.fn().mockResolvedValue('purchased'),
  restorePurchases: jest.fn().mockResolvedValue(null),
  hasProEntitlement: () => false,
  TRIAL_DAYS: 7,
}));

const mockPost = jest.fn().mockResolvedValue({ completed: true });
jest.mock('@/lib/api', () => ({
  api: { onboarding: { post: (...args: unknown[]) => mockPost(...args) } },
  ApiError: class ApiError extends Error {},
}));

async function pressContinue(): Promise<void> {
  const tree = renderScreen(<PaywallScreen />);
  const cta = buttonWithTitle(tree, 'See plans & start free trial')!;
  await act(async () => {
    (cta.props.onPress as () => void)();
    await new Promise((r) => setImmediate(r));
  });
}

beforeEach(() => {
  useOnboardingStore.getState().reset();
  mockPost.mockClear();
  useOnboardingStore.getState().setMeasurements({ age: 30, sex: 'male', height_cm: 180, weight_kg: 80 });
  useOnboardingStore.getState().setActivity('moderate');
  useOnboardingStore.getState().setGoal('lose');
});

test('pressing the primary CTA posts the onboarding payload exactly once', async () => {
  await pressContinue();
  expect(mockPost).toHaveBeenCalledTimes(1);
});

test('the posted payload matches the onboarding store answers', async () => {
  await pressContinue();
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      age: 30,
      sex: 'male',
      height: 180,
      weight: 80,
      activity_level: 'moderate',
      goal: 'lose',
    }),
  );
});
