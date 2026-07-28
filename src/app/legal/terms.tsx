// Terms of Service. Content is data (see LegalScreen). Keep in sync with the
// paywall pricing and the Privacy Policy.
import type { JSX } from 'react';

import { LegalScreen, type LegalSection } from '@/components/navigation/LegalScreen';
import { TRIAL_DAYS } from '@/lib/billing/purchases';

const UPDATED = '14 July 2026';

const SECTIONS: LegalSection[] = [
  {
    heading: 'Acceptance of Terms',
    body: [
      'By downloading, accessing, or using Lumo (the "App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App. You must be at least 16 years old to use Lumo.',
      'We may update these Terms from time to time. Continued use of the App after a change means you accept the revised Terms; the "Last updated" date above reflects the most recent version.',
    ],
  },
  {
    heading: 'Description of Service',
    body: [
      'Lumo is a food and fitness tracking app. It lets you log meals (by search, barcode, nutrition-label scan, or photo scan), track workouts and streaks, set calorie and macro goals, and receive AI-generated summaries and insights based on the data you log.',
      'Estimates produced by the App — including photo-scan calorie counts, macro breakdowns, and AI insights — are approximations for informational purposes and are not guaranteed to be accurate.',
    ],
  },
  {
    heading: 'Subscription Terms',
    body: [
      `Lumo offers an optional auto-renewing subscription: US$8.99 per month or US$49.99 per year, each with a ${TRIAL_DAYS}-day free trial for new subscribers.`,
      'Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions renew automatically unless auto-renew is turned off at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the end of the current period.',
      'You can manage or cancel your subscription in your device Settings under your Apple ID > Subscriptions. Cancelling stops future renewals; the current paid period is not refunded. Any unused portion of a free trial is forfeited when you purchase a subscription.',
    ],
  },
  {
    heading: 'User Responsibilities',
    body: [
      'You are responsible for the accuracy of the information you enter and for keeping your account credentials secure. You agree not to misuse the App, attempt to disrupt or reverse-engineer it, or use it to violate any law.',
      'You retain ownership of the content you create (your logs, notes, and photos). You grant us a limited licence to process that content solely to provide the service to you.',
    ],
  },
  {
    heading: 'Health Disclaimer',
    body: [
      'Lumo provides general nutrition and fitness information. It is not medical advice. Consult a healthcare professional before making significant changes to your diet or exercise routine.',
      'Lumo is NOT a medical device and does NOT provide medical, nutritional, or professional health advice. It is a general wellness and informational tool only.',
      'Always consult a qualified healthcare professional before making decisions about your diet, exercise, medication, or health — especially if you are pregnant, nursing, under 18, or have a medical condition or eating disorder. Never disregard professional medical advice or delay seeking it because of something in the App. If you think you may have a medical emergency, contact your doctor or emergency services immediately.',
      'You use the App and rely on its estimates and insights at your own risk.',
    ],
  },
  {
    heading: 'Intellectual Property',
    body: [
      'The App, including its design, code, trademarks, and content we provide, is owned by Lumo and its licensors and is protected by intellectual property laws. These Terms grant you a personal, non-transferable, non-exclusive licence to use the App; they do not transfer any ownership to you.',
    ],
  },
  {
    heading: 'Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, the App is provided "as is" and "as available" without warranties of any kind. We do not warrant that the App will be uninterrupted, error-free, or that its estimates are accurate.',
      'To the maximum extent permitted by law, Lumo will not be liable for any indirect, incidental, special, or consequential damages, or for any loss arising from your use of or reliance on the App. Nothing in these Terms excludes rights you have under the Australian Consumer Law or other laws that cannot be excluded.',
    ],
  },
  {
    heading: 'Termination',
    body: [
      'You may stop using the App and delete your account at any time from Settings > Delete my account, which permanently removes your data. We may suspend or terminate access if you breach these Terms or misuse the service. Provisions that by their nature should survive termination (such as intellectual property, disclaimers, and limitation of liability) will survive.',
    ],
  },
  {
    heading: 'Governing Law',
    body: [
      'These Terms are governed by the laws of the State of South Australia, Australia, and you submit to the non-exclusive jurisdiction of the courts of South Australia, without regard to conflict-of-law principles.',
    ],
  },
  {
    heading: 'Contact',
    body: ['Questions about these Terms? Email us at lumofit@gmail.com.'],
  },
];

export default function TermsScreen(): JSX.Element {
  return (
    <LegalScreen
      title="Terms of Service"
      updated={UPDATED}
      intro="Please read these Terms carefully before using Lumo."
      sections={SECTIONS}
    />
  );
}
