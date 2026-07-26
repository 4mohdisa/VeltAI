import type { Metadata } from 'next';

import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'What Lumo collects, how it is used, and the choices you have. No ad SDKs, no selling health data, photos never retained.',
  alternates: { canonical: '/privacy/' },
};

export default function PrivacyPage() {
  return (
    <div className="container section">
      <article className="prose">
        <span className="eyebrow">Legal</span>
        <h1 style={{ marginTop: '0.75rem' }}>Privacy policy</h1>
        <p className="muted small" style={{ marginTop: '0.75rem', marginBottom: '2rem' }}>
          Last updated: 26 July 2026
        </p>

        <p>
          This policy explains what Lumo (the &ldquo;App&rdquo;) and this website collect, how that
          data is used, and the choices you have.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Account: your email address, managed by our authentication provider.</li>
          <li>
            What you log: food entries (including meal type, quantities, and macros), workouts, gym
            sessions and streaks, body stats you enter (age, sex, height, weight, goals), and
            body-weight history.
          </li>
          <li>
            Photos: when you scan a meal or a nutrition label, the photo is sent for analysis to
            produce an estimate. Photos are processed to generate the estimate and are not retained
            on our servers beyond that scan.
          </li>
          <li>
            Usage: basic technical data needed to run the service. We do not use advertising SDKs
            and do not track you across other apps or websites.
          </li>
        </ul>

        <h2>How we use your data</h2>
        <p>
          We use your data only to provide the service: to store and display your logs, compute your
          calorie and macro targets, track streaks, generate summaries and insights, and personalise
          estimates over time. We do not sell your personal data, and we never sell or share your
          health data for advertising.
        </p>

        <h2>Analytics</h2>
        <p>
          In the App, we use first-party product analytics only. Events like &ldquo;meal
          logged&rdquo; are sent to our own servers so we can see which features are used and fix
          what isn&apos;t working. There are no advertising or third-party tracking SDKs in the App,
          and you can turn product analytics off in Settings &gt; Privacy.
        </p>
        <p>
          On this website, we use Google Analytics to count page visits — and only after you accept
          the consent note shown on your first visit. If your browser sends Do Not Track or Global
          Privacy Control, Google Analytics never loads at all, regardless of any stored choice.
        </p>

        <h2>Third-party services</h2>
        <p>
          We rely on a small set of processors that handle data on our behalf: Clerk (authentication
          and account management), Supabase (encrypted database hosting), Google Gemini (photo and
          label analysis), Anthropic (AI-written insights and summaries), and RevenueCat
          (subscription management).
        </p>
        <p>
          If you connect them yourself, Strava and WHOOP share your workout data with the App so it
          can be imported. You can disconnect either at any time from Settings &gt; Connected apps,
          which stops future syncing.
        </p>
        <p>
          Each processor handles data under its own privacy terms and only for the purpose of
          providing its part of the service.
        </p>

        <h2>Photos</h2>
        <p>
          Meal and label photos are used solely to generate a nutrition estimate at the moment you
          scan. They are not stored on our servers after processing and are not used to train models
          or for any other purpose.
        </p>

        <h2>Your health data stays private</h2>
        <p>
          Your food, workout, and body data is yours. It is never sold, never shared for
          advertising, and never exposed to other users. There are no ad SDKs in the App. Access is
          restricted to you — row-level security scopes every record to its owner.
        </p>

        <h2>Data retention and deletion</h2>
        <p>
          We keep your data for as long as your account exists so the App can show your history.
          When you delete your account (Settings &gt; Delete my account), all of your data —
          profile, logs, workouts, goals, and connections — is permanently removed from our database
          via cascading deletion. This cannot be undone.
        </p>

        <h2>Your rights</h2>
        <p>
          You can access and edit your data in the App at any time, and you can permanently delete
          your account and all associated data from Settings. Depending on your location, you may
          have additional rights (such as data portability); email us to make a request.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about your privacy or a data request? Email us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </article>
    </div>
  );
}
