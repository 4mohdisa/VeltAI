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
import i18n from '@/lib/i18n';

const UPDATED = '25 November 2026';

const AWAITING = 'This section is being drafted with a legal adviser and is not final.';

const SECTIONS: LegalSection[] = [
  {
    heading: 'Agreement and acceptance',
    body: [
      'By downloading, accessing or using Lume, you agree to be bound by these Terms. If you do not agree, do not use the app.',
    ],
  },
  {
    heading: 'Who we are',
    pending: true,
    body: [`${AWAITING} It will identify the entity that operates Lume.`],
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
      'Lume logs food by search, barcode, nutrition-label photograph, meal photograph, quick add, saved meals and recipes; logs gym sessions against a weekly schedule and templates; computes energy expenditure from published ACSM metabolic equations for treadmill, cycling, rowing and stair climbing, and a MET estimate elsewhere; reconciles calories in against your basal metabolic rate plus logged exercise; and generates written insights from your own logged data.',
      'Estimates produced from a photograph are estimates. Each one carries a confidence score rather than being presented as certain.',
    ],
  },
  {
    heading: 'Health disclaimer',
    // A getter, so the paragraphs follow the current language each render.
    get body() {
      const k = 'legal.terms.healthDisclaimer';
      return [
        `${i18n.t(`${k}.notMedicalAdvice`)} ${i18n.t(`${k}.notMedicalDevice`)}`,
        `${i18n.t(`${k}.consultProfessional`)} ${i18n.t(`${k}.neverDisregard`)}`,
        i18n.t(`${k}.emergency`),
        `${i18n.t(`${k}.targetsFormulas`)} ${i18n.t(`${k}.targetsStartingPoint`)} ${i18n.t(`${k}.ownRisk`)}`,
      ];
    },
  },
  {
    heading: 'Subscriptions and billing',
    body: [
      'Lume Pro is an optional auto-renewing subscription purchased through Apple’s in-app purchase system. Payment is charged to your Apple ID, and we never receive your payment details.',
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
      'Lume relies on Clerk, Supabase, RevenueCat and Google Gemini (and Anthropic only if our backup AI provider is switched on), and on Strava and WHOOP if you connect them. Each is described in the Privacy Policy and is governed by its own terms. Australian food data comes from the Australian Food Composition Database (Release 3), © Food Standards Australia New Zealand, used under the FSANZ Data User Licence Agreement; it is based on Australian data, which may not be appropriate for use in other countries, and FSANZ does not endorse Lume.',
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
      intro="The agreement between you and Lume, and the limits of what the app claims to do. These terms are a working draft and have not been reviewed by an Australian lawyer."
      sections={SECTIONS}
    />
  );
}
