// Row 14a · The features a user can rate. This is the only list of feature keys.
export const FEATURE_KEYS = [
  'food_logging',
  'barcode_scan',
  'photo_scan',
  'ai_insights',
  'gym_session',
  'workout_templates',
  'goals',
  'streaks',
  'export',
  'notifications',
  'healthkit',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Asked only after a purchase or a cancel, so kept apart from the in-use prompts. */
export const AFTER_PURCHASE_FEATURE_KEYS = ['paywall', 'trial'] as const;

export type AfterPurchaseFeatureKey = (typeof AFTER_PURCHASE_FEATURE_KEYS)[number];
