import type { Metadata } from 'next';

import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Security',
  description:
    'How Lume protects your data: records scoped to their owner, encrypted tokens, photos never stored, no tracking SDKs, and full deletion.',
  alternates: { canonical: '/security/' },
};

export default function SecurityPage() {
  return (
    <div className="container section">
      <article className="prose">
        <span className="eyebrow">Security</span>
        <h1 style={{ marginTop: '0.75rem' }}>Your data stays yours</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Health data deserves more care than most apps give it. Here is, plainly, how Lume protects
          yours.
        </p>

        <h2>Every record is scoped to its owner</h2>
        <p>
          Your food logs, workouts, and body stats are protected by row-level security in the
          database itself — every record is tied to your account, and the database refuses to serve
          it to anyone else. This isn&apos;t an app-level check that could be forgotten somewhere;
          it&apos;s enforced on every table, at the lowest layer.
        </p>

        <h2>Photos are never stored</h2>
        <p>
          Meal and label photos are processed in memory to produce your estimate and then discarded.
          We keep only the measurement metadata (angles, portion geometry) — never the image itself.
          There is no photo library of your meals sitting on a server anywhere.
        </p>

        <h2>Connected-app tokens are encrypted</h2>
        <p>
          If you connect Strava or WHOOP, the access tokens that make the connection work are
          encrypted at rest with strong, industry-standard encryption. If the encryption key
          isn&apos;t available, the system refuses to operate rather than falling back to storing
          anything in plain text.
        </p>

        <h2>No ad or tracking SDKs</h2>
        <p>
          The app contains no advertising SDKs and no third-party trackers. The only analytics are
          first-party, on our own servers, and you can switch them off in Settings. Our logs are
          minimal and operational — no tokens, no personal data, no request contents.
        </p>

        <h2>Deleting your account deletes everything</h2>
        <p>
          Account deletion cascades through the entire database: profile, logs, workouts, goals, and
          connections are all permanently removed. We don&apos;t keep a shadow copy, and it cannot
          be undone.
        </p>

        <h2>Found a security concern?</h2>
        <p>
          Tell us. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with the details
          and we&apos;ll investigate promptly. We appreciate responsible disclosure and will keep
          you informed of what we find.
        </p>
      </article>
    </div>
  );
}
