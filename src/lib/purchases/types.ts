// App-side purchase models. Screens use these, never the RevenueCat SDK types.

export type PurchasablePackage = {
  identifier: string;
  productId: string;
  /** The store's own localised price, shown as is. */
  priceString: string;
  periodLabel: string;
  /** From the store's eligibility check only; false unless it says eligible. */
  trialEligible: boolean;
};

export type Offering = {
  identifier: string;
  packages: PurchasablePackage[];
};

export type EntitlementState = 'trial' | 'active' | 'billing_issue' | 'cancelled_active' | 'expired' | 'none';

export type PurchaseResult = { kind: 'purchased' } | { kind: 'cancelled' } | { kind: 'error'; code: string };
