// Privacy Policy (in-app).
//
// The SECTION LIST is canonical and lives in legal/manifest.json — the same
// contract the website implements. src/__tests__/legalParity.test.ts fails if
// this file and the manifest drift apart, so the two surfaces cannot diverge
// silently. See DECISIONS.md for why the content is duplicated rather than
// shared (the packages deliberately have no cross-imports).
//
// Sections marked `pending` are awaiting a lawyer. They render inside a
// bordered PENDING block so they cannot read as finished text.
import type { JSX } from 'react';

import { LegalScreen, type LegalSection } from '@/components/navigation/LegalScreen';

const UPDATED = '2 August 2026';

const AWAITING = 'This section is being drafted with a legal adviser and is not final.';

const SECTIONS: LegalSection[] = [
  {
    heading: 'Who we are',
    pending: true,
    body: [`${AWAITING} It will identify the entity that operates Lumo and its contact details.`],
  },
  {
    heading: 'What this policy covers',
    pending: true,
    body: [`${AWAITING} It will set out which products this policy applies to.`],
  },
  {
    heading: 'Personal information we collect',
    body: [
      'Account: your email address and name, managed by our authentication provider.',
      'Health information: your body weight, height, age and sex; your activity level and goal; your calorie and macro targets; and your body-weight history. Health information is sensitive information under the Privacy Act.',
      'Fitness information: gym sessions and the exercises and parameters you record, your weekly schedule, and your streaks.',
      'Content you create: photographs of meals and nutrition labels at the moment you scan them, food names and quantities, notes, recipes and saved foods.',
      'Usage: a fixed list of twelve event names describing which features are used — never what you logged. No food names, no quantities, no photographs, no health values.',
      'Purchases: whether you hold an active subscription. Payment details are handled by Apple and never reach us.',
    ],
  },
  {
    heading: 'Sensitive information and consent',
    pending: true,
    body: [
      'Before your first meal photograph or AI request, Lumo shows a one-time disclosure naming Google Gemini and Anthropic, and sends nothing until you accept. That acknowledgement is stored on your device and covers sharing with those two processors.',
      `${AWAITING} The express consent mechanism required for collecting health information under Australian Privacy Principle 3.3 is being drafted; the disclosure above is narrower than that.`,
    ],
  },
  {
    heading: 'Why we collect it',
    body: [
      'We use your data only to provide the service: to store and display your logs, compute your calorie and macro targets, compute exercise energy expenditure, reconcile your energy balance, estimate the contents of a photographed meal, improve those estimates from your corrections, and determine your access to subscriber features.',
      'We do not sell your personal information, and we never share health information for advertising.',
    ],
  },
  {
    heading: 'Who we disclose it to',
    body: [
      'Always, to run the service: Clerk (authentication — your email and name), Supabase (database hosting — every row of your data), and RevenueCat (subscriptions — your user id and purchase status).',
      'Only when you use the feature, and only after you accept the AI disclosure: Google Gemini receives the photograph you are scanning, and Anthropic receives a summary of your logged data to write the wording of insights.',
      'Only if you connect them yourself: Strava and WHOOP. Neither is operational today.',
      'Each processor handles data under its own terms and only to provide its part of the service.',
    ],
  },
  {
    heading: 'Overseas disclosure',
    pending: true,
    body: [
      `${AWAITING} It will identify the countries in which each processor stores and processes data, as Australian Privacy Principle 8 requires.`,
    ],
  },
  {
    heading: 'Storage, security and retention',
    body: [
      'Traffic between the app and our servers is encrypted in transit. Every table enforces row-level security, so one account cannot read another account’s rows. Tokens for connected services are encrypted at rest with AES-256-GCM.',
      'Meal and label photographs are not retained by us — the scan record keeps a quality score and the geometry derived from the image, not the image. The photograph is transmitted in full to Google Gemini to be analysed.',
      'Retention periods are still being determined and will be stated here.',
    ],
  },
  {
    heading: 'Access and correction',
    body: [
      'You can export everything we hold about you from Settings, as a single machine-readable file, and you can view and correct your profile, goals and every logged entry in the app at any time.',
    ],
  },
  {
    heading: 'Deleting your account',
    body: [
      'Deleting your account from Settings is immediate and destructive. Your sign-in identity is deleted first, so the account can no longer be signed into, then your data is deleted and every related record goes with it. There is no grace period.',
      'If the identity deletion fails, the operation stops and reports an error without deleting your data — we never report a deletion that did not happen.',
    ],
  },
  {
    heading: 'Complaints',
    pending: true,
    body: [
      `${AWAITING} It will set out how to complain about a privacy breach, the timeframe for a response, and the escalation path to the Office of the Australian Information Commissioner.`,
    ],
  },
  {
    heading: 'Cookies and analytics',
    body: [
      'We run first-party product analytics on our own servers to understand which features are used. These events never include what you logged. There are no advertising or third-party tracking SDKs in the app.',
      'Analytics is currently on by default. You can turn it off at any time in Settings > Privacy; when it is off, nothing is collected.',
    ],
  },
  {
    heading: 'Children',
    pending: true,
    body: [`${AWAITING} A minimum age and how it is enforced are still being decided.`],
  },
  {
    heading: 'Changes to this policy',
    pending: true,
    body: [`${AWAITING}`],
  },
  {
    heading: 'Contact',
    pending: true,
    body: [`${AWAITING} A dedicated privacy contact will be published here.`],
  },
];

export default function PrivacyPolicyScreen(): JSX.Element {
  return (
    <LegalScreen
      title="Privacy Policy"
      updated={UPDATED}
      intro="What Lumo collects, why, who else sees it, and what you can do about it. Lumo collects health information, which is sensitive information under the Privacy Act 1988 (Cth). This policy is a working draft and has not been reviewed by an Australian privacy lawyer."
      sections={SECTIONS}
    />
  );
}
