// Site-wide constants. NEXT_PUBLIC_SITE_URL is set at deploy time (see README);
// the fallback keeps local builds working.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lume.fit';
export const SITE_NAME = 'Lume';
export const SUPPORT_EMAIL = 'lumofit@gmail.com';
export const TAGLINE = 'Make going to the gym the easy choice.';
export const DESCRIPTION =
  'Lume is a food and fitness tracker that tells you the truth: calorie estimates with confidence ranges instead of fake precision, honest gym tracking, and your health data kept private. Coming soon to the App Store.';
