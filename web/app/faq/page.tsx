import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Honest answers about Lumo: how accurate the calorie scanning is, how photos are handled, pricing, privacy, and when it launches.',
  alternates: { canonical: '/faq/' },
};

// One source of truth: rendered as the page AND serialized as FAQPage JSON-LD.
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How accurate is the calorie scanning?',
    a: 'It is an estimate, and we say so. Lumo measures portions from the geometry of your photo (a second angle lets it cross-check itself) and uses a vision model to identify the food. Every result shows a range and a confidence level rather than one fake-precise number, and the estimates get tighter over time as Lumo learns your usual portions. You can always correct a result — corrections make it more accurate for you.',
  },
  {
    q: 'How does photo scanning work?',
    a: 'You point your camera at the plate. Lumo estimates portion sizes from the photo’s geometry, identifies the dishes with a vision model, and combines the two into a calorie and macro estimate with a stated confidence. When it is unsure about something specific — say, whether the curry has coconut cream — it asks you instead of guessing.',
  },
  {
    q: 'Is my health data private?',
    a: 'Yes. Every record in our database is scoped to its owner with row-level security, so your data is only ever accessible to you. We never sell health data and never share it for advertising, and the app contains no ad or third-party tracking SDKs. Meal photos are processed to produce the estimate and are not retained afterwards.',
  },
  {
    q: 'What does it cost?',
    a: 'The download is free. An optional subscription is US$8.99 per month or US$49.99 per year, each with a 7-day free trial. Billing is handled by Apple through your Apple ID.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — 7 days on either subscription, for new subscribers. You can cancel during the trial in your Apple ID subscription settings and pay nothing.',
  },
  {
    q: 'Does it know my cuisine?',
    a: 'Lumo’s food knowledge is built around real cuisines — curry, laksa, biryani, pho — not just Western chain menus. It also learns the dishes you actually eat, so your regular meals get recognised faster and estimated better.',
  },
  {
    q: 'Does it sync with Apple Health, Strava, or WHOOP?',
    a: 'Yes. You can connect Apple Health, Strava, and WHOOP so workouts tracked elsewhere count in your energy balance. Each connection is optional, made by you, and can be disconnected at any time from Settings.',
  },
  {
    q: 'Can I delete my data?',
    a: 'Yes, fully. Deleting your account from Settings permanently removes everything — profile, logs, workouts, goals, and connections — via cascading deletion in our database. It cannot be undone, and nothing is kept.',
  },
  {
    q: 'When does it launch?',
    a: 'Lumo is coming soon to the App Store, iOS first. If you want a single email when it is live, use the link on the home page.',
  },
  {
    q: 'Is there an Android version?',
    a: 'Not yet. We are building for iOS first and would rather ship one good app than two half-finished ones. Android is on the list, but we have no date to promise.',
  },
];

export default function FaqPage() {
  return (
    <div className="container section">
      <article className="prose">
        <span className="eyebrow">Questions</span>
        <h1 style={{ marginTop: '0.75rem' }}>Frequently asked questions</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Straight answers. If yours isn&apos;t here, <a href="/support/">ask us directly</a>.
        </p>

        {FAQS.map((f) => (
          <section key={f.q}>
            <h2>{f.q}</h2>
            <p>{f.a}</p>
          </section>
        ))}
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
    </div>
  );
}
