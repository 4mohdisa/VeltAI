import { Platform } from 'react-native';

import { isManageSubscriptionAvailable } from '@/lib/billing/subscriptionLinks';

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['ios', true],
  ['android', false],
] as const)('isManageSubscriptionAvailable on %s is %s', (os, expected) => {
  jest.replaceProperty(Platform, 'OS', os);
  expect(isManageSubscriptionAvailable()).toBe(expected);
});
