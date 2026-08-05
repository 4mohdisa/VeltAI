import type { Metadata } from 'next';

import { SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Get help with Lume: email us directly, what to include in a bug report, and how quickly to expect a reply.',
  alternates: { canonical: '/support/' },
};

export default function SupportPage() {
  return (
    <div className="container section">
      <article className="prose">
        <span className="eyebrow">Help</span>
        <h1 style={{ marginTop: '0.75rem' }}>Support</h1>

        <p style={{ marginTop: '1.5rem' }}>
          The fastest way to reach us is email:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. It goes straight to the people
          who build the app.
        </p>
        <p>
          Common questions — pricing, accuracy, privacy, launch dates — are answered on the{' '}
          <a href="/faq/">FAQ page</a>, so it&apos;s worth a look first.
        </p>

        <h2>Reporting a bug</h2>
        <p>To help us fix it quickly, include:</p>
        <ul>
          <li>What you were doing when it happened (e.g. scanning a meal, checking in at the gym).</li>
          <li>What you expected, and what happened instead.</li>
          <li>Your iPhone model and iOS version.</li>
          <li>A screenshot, if the problem is visible.</li>
        </ul>

        <h2>Response time</h2>
        <p>
          We&apos;re a small team, so replies come from a human — usually within a few days. We read
          everything.
        </p>
      </article>
    </div>
  );
}
