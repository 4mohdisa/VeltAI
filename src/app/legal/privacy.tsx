// Privacy Policy. Content is data (see LegalScreen). Keep the third-party list in
// sync with the actual integrations (Clerk, Supabase, Gemini, Anthropic,
// RevenueCat, Strava/WHOOP).
import type { JSX } from 'react';

import { LegalScreen, type LegalSection } from '@/components/navigation/LegalScreen';

const UPDATED = '26 July 2026';

const SECTIONS: LegalSection[] = [
  {
    heading: 'What We Collect',
    body: [
      'Account: your email address, managed by our authentication provider.',
      'What you log: food entries (including meal type, quantities, and macros), workouts, gym sessions and streaks, body stats you enter (age, sex, height, weight, goals), and body-weight history.',
      'Photos: when you scan a meal or a nutrition label, the photo is sent for analysis to produce an estimate. Photos are processed to generate the estimate and are not retained on our servers beyond that scan.',
      'Usage: basic technical data needed to run the service. We do not use advertising SDKs and do not track you across other apps or websites.',
    ],
  },
  {
    heading: 'How We Use Your Data',
    body: [
      'We use your data only to provide the service: to store and display your logs, compute your calorie and macro targets, track streaks, generate summaries and insights, and personalise estimates over time. We do not sell your personal data, and we never sell or share your health data for advertising.',
    ],
  },
  {
    heading: 'Third-Party Services',
    body: [
      'We rely on a small set of processors that handle data on our behalf: Clerk (authentication and account management), Supabase (encrypted database hosting), Google Gemini (photo and label analysis), Anthropic (AI-written insights and summaries), and RevenueCat (subscription management).',
      'If you connect them yourself, Strava and WHOOP share your workout data with the App so it can be imported. You can disconnect either at any time from Settings > Connected apps, which stops future syncing.',
      'Each processor handles data under its own privacy terms and only for the purpose of providing its part of the service.',
    ],
  },
  {
    heading: 'Photos',
    body: [
      'Meal and label photos are used solely to generate a nutrition estimate at the moment you scan. They are not stored on our servers after processing and are not used to train models or for any other purpose.',
    ],
  },
  {
    heading: 'Your Health Data Stays Private',
    body: [
      'Your food, workout, and body data is yours. It is never sold, never shared for advertising, and never exposed to other users. There are no ad SDKs in the App. Access is restricted to you (row-level security scopes every record to its owner).',
    ],
  },
  {
    heading: 'Analytics',
    body: [
      'We run first-party product analytics on our own servers to understand which screens and features are used — for example, that a meal was logged or a scan was confirmed. These events never include what you logged: no food names, no quantities, no photos, no health data.',
      'There are no third-party analytics or tracking SDKs in the App. You can opt out at any time in Settings > Privacy; when analytics is off, nothing is collected.',
    ],
  },
  {
    heading: 'Data Retention and Deletion',
    body: [
      'We keep your data for as long as your account exists so the App can show your history. When you delete your account (Settings > Delete my account), all of your data — profile, logs, workouts, goals, and connections — is permanently removed from our database via cascading deletion. This cannot be undone.',
    ],
  },
  {
    heading: 'Your Rights',
    body: [
      'You can access and edit your data in the App at any time, and you can permanently delete your account and all associated data from Settings. Depending on your location, you may have additional rights (such as data portability); email us to make a request.',
    ],
  },
  {
    heading: 'Contact',
    body: ['Questions about your privacy or a data request? Email us at lumofit@gmail.com.'],
  },
];

export default function PrivacyPolicyScreen(): JSX.Element {
  return (
    <LegalScreen
      title="Privacy Policy"
      updated={UPDATED}
      intro="This policy explains what Lumo collects, how it is used, and the choices you have."
      sections={SECTIONS}
    />
  );
}
