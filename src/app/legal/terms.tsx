// Terms of Service (in-app).
//
// Section list is canonical in legal/manifest.json; src/__tests__/legalParity.test.ts
// enforces it against this file and the website. See DECISIONS.md.
//
// NOTE ON PRICES: this screen previously stated "US$8.99 per month or US$49.99
// per year". Those figures appear in NO code and in NO configured App Store
// product — they were invented. They are gone. Apple shows the real price
// before purchase, which is both accurate and what Apple requires.
import type { JSX } from 'react';

import { LegalScreen, type LegalSection } from '@/components/navigation/LegalScreen';
import { TRIAL_DAYS } from '@/lib/billing/purchases';

const UPDATED = '2 August 2026';

const AWAITING = 'This section is being drafted with a legal adviser and is not final.';

const SECTIONS: LegalSection[] = [
  {
    heading: 'Agreement and acceptance',
    body: [
      'By downloading, accessing or using Lumo, you agree to be bound by these Terms. If you do not agree, do not use the app.',
    ],
  },
  {
    heading: 'Who we are',
    pending: true,
    body: [`${AWAITING} It will identify the entity that operates Lumo.`],
  },
  {
    heading: 'Eligibility and your account',
    pending: true,
    body: [
      `${AWAITING} A minimum age and how it is enforced are still being decided.`,
      'You are responsible for the accuracy of what you enter and for keeping your account secure.',
    ],
  },
  {
    heading: 'The service',
    body: [
      'Lumo logs food by search, barcode, nutrition-label photograph, meal photograph, quick add, saved meals and recipes; logs gym sessions against a weekly schedule and templates; computes energy expenditure from published ACSM metabolic equations for treadmill, cycling, rowing and stair climbing, and a MET estimate elsewhere; reconciles calories in against your basal metabolic rate plus logged exercise; and generates written insights from your own logged data.',
      'Estimates produced from a photograph are estimates. Each one carries a confidence score rather than being presented as certain.',
    ],
  },
  {
    heading: 'Health disclaimer',
    body: [
      'Lumo provides general nutrition and fitness information. It is not medical advice, it is not a medical device, and it does not diagnose, treat, cure or prevent any condition.',
      'Always consult a qualified healthcare professional before making decisions about your diet, exercise, medication or health — particularly if you are pregnant or nursing, are under 18, or have a medical condition or a history of disordered eating. Never disregard professional medical advice, or delay seeking it, because of something you read in the app.',
      'If you think you may have a medical emergency, contact your doctor or your local emergency service immediately.',
      'Calorie and macro targets are calculated from standard published formulas using the information you provide. They are a starting point, not a prescription. You rely on the app’s estimates and insights at your own risk.',
    ],
  },
  {
    heading: 'Subscriptions and billing',
    body: [
      'Lumo Pro is an optional auto-renewing subscription purchased through Apple’s in-app purchase system. Payment is charged to your Apple ID, and we never receive your payment details.',
      `New subscribers get a ${TRIAL_DAYS}-day free trial.`,
      'Apple shows you the exact price, the billing period and the renewal terms before you confirm. Subscriptions renew automatically unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage or cancel a subscription at any time in your Apple ID subscription settings. Refunds are handled by Apple under its own policies.',
    ],
  },
  {
    heading: 'Free tier and limits',
    body: [
      'A free tier covers manual, search and barcode logging, nutrition-label scanning, a daily allowance of photograph scans, all gym features, your dashboards and energy balance, data export and account deletion. The app shows your current scan allowance and what remains of it.',
    ],
  },
  {
    heading: 'Acceptable use',
    pending: true,
    body: [
      `${AWAITING}`,
      'In the meantime: do not misuse the app, attempt to disrupt or reverse-engineer it, or use it to break the law.',
    ],
  },
  {
    heading: 'Your content',
    pending: true,
    body: [
      'You own the content you create — your logs, notes and photographs.',
      `${AWAITING} The precise licence needed to transmit a photograph to a third-party AI processor for analysis is being drafted.`,
    ],
  },
  {
    heading: 'Intellectual property',
    pending: true,
    body: [`${AWAITING}`],
  },
  {
    heading: 'Third-party services',
    body: [
      'Lumo relies on Clerk, Supabase, RevenueCat, Google Gemini and Anthropic, and on Strava and WHOOP if you connect them. Each is described in the Privacy Policy and is governed by its own terms.',
    ],
  },
  {
    heading: 'Disclaimers and liability',
    pending: true,
    body: [
      `${AWAITING} Australian Consumer Law guarantees cannot be excluded, so this clause is being drafted for Australian law rather than adapted from a template.`,
      'Nothing in these Terms excludes rights you have under the Australian Consumer Law or any other law that cannot be excluded.',
    ],
  },
  {
    heading: 'Termination',
    body: [
      'You may delete your account at any time from Settings, which permanently removes your data.',
      'We may suspend or terminate access if you breach these Terms; the grounds and process are being finalised.',
    ],
  },
  {
    heading: 'Changes to these terms',
    body: [
      'We may update these Terms. Continued use after a change means you accept the revised Terms, and the "last updated" date above reflects the most recent version.',
    ],
  },
  {
    heading: 'Governing law',
    body: [
      'These Terms are governed by the laws of the State of South Australia, Australia, and you submit to the non-exclusive jurisdiction of its courts.',
    ],
  },
  {
    heading: 'Contact',
    pending: true,
    body: [`${AWAITING} A contact address for notices will be published here.`],
  },
];

export default function TermsScreen(): JSX.Element {
  return (
    <LegalScreen
      title="Terms of Service"
      updated={UPDATED}
      intro="The agreement between you and Lumo, and the limits of what the app claims to do. These terms are a working draft and have not been reviewed by an Australian lawyer."
      sections={SECTIONS}
    />
  );
}
