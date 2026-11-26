import { paywallHref, WINBACK_REASON } from '@/lib/nav';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

describe('paywallHref', () => {
  it('returns the plain paywall path without a reason', () => {
    expect(paywallHref()).toBe('/onboarding/paywall');
  });

  it('returns the plain paywall path for an empty reason', () => {
    expect(paywallHref('')).toBe('/onboarding/paywall');
  });

  it('adds the reason as a query parameter', () => {
    expect(paywallHref('trial_expired')).toBe('/onboarding/paywall?reason=trial_expired');
  });

  it('opens the paywall for the win back offer', () => {
    expect(paywallHref(WINBACK_REASON)).toBe('/onboarding/paywall?reason=winback');
  });

  it('encodes a reason with reserved characters', () => {
    expect(paywallHref('a&b=c d')).toBe('/onboarding/paywall?reason=a%26b%3Dc%20d');
  });
});
