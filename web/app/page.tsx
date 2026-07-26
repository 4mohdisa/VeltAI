import type { Metadata } from 'next';

import { TrackedLink } from '@/components/TrackedLink';
import { FalsePrecisionCard, PlateGeometry, ScanReviewCard } from '@/components/mock/ScanReviewCard';
import { EnergyBalanceCard, FoodDayCard, GymCheckinCard } from '@/components/mock/AppCards';
import { DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_EMAIL, TAGLINE } from '@/lib/site';

export const metadata: Metadata = {
  // absolute: the layout's "%s · Lumo" template would double the brand here.
  title: { absolute: `${SITE_NAME} — ${TAGLINE}` },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
};

const FEATURES: { title: string; body: string }[] = [
  {
    title: 'Honest photo scanning',
    body: 'Point your camera at a plate. Lumo measures portions from the geometry of the photo — add a second angle and it cross-checks itself. Every estimate comes with a confidence level and a range, and when it isn’t sure, it asks you instead of guessing.',
  },
  {
    title: 'Barcode & label scan',
    body: 'Packaged food is the easy case: scan the barcode or the nutrition label and log exactly what the manufacturer printed. No estimating where none is needed.',
  },
  {
    title: 'Knows your cuisine',
    body: 'Curry, laksa, biryani, pho — Lumo’s food knowledge is built around real cuisines, not just Western chain menus, and it learns the dishes you actually eat.',
  },
  {
    title: 'Gym plans that fit your week',
    body: 'Set a weekly schedule, check in when you’re there, and keep a streak that understands life happens — freeze a day instead of losing everything.',
  },
  {
    title: 'Calorie burn with the math shown',
    body: 'Cardio burn is computed per exercise from published ACSM equations — speed, incline, watts, split times — not one flat number for "exercise". Tap any number to see how it was calculated.',
  },
  {
    title: 'Energy balance, both sides',
    body: 'Calories in from your food log, calories out from your workouts and integrations, reconciled in one place — so a deficit is a measurement, not a feeling.',
  },
  {
    title: 'An AI that learns your habits',
    body: 'Lumo notices your portions, your usual meals, and your corrections, and quietly gets more accurate for you specifically. The numbers are computed, the words are written — never the other way around.',
  },
  {
    title: 'Works with your other gear',
    body: 'Apple Health, Strava and WHOOP connect in a couple of taps, so workouts you track elsewhere count here too. Disconnect any of them whenever you like.',
  },
];

const THESIS: { title: string; body: string }[] = [
  {
    title: 'Ranges, not fake precision',
    body: 'No app can know a plate of curry is exactly 643 calories. Lumo shows you the honest range and how confident it is — and gets tighter as it learns your portions.',
  },
  {
    title: 'No dark patterns',
    body: 'No guilt screens, no fake urgency, no streak-shaming, no notification spam engineered to make you anxious. The app respects that you have a life.',
  },
  {
    title: 'Private by design',
    body: 'Your health data is scoped to you at the database level, never sold, and never used for ads. Meal photos are processed for the estimate and not kept.',
  },
  {
    title: 'No ad or tracking SDKs',
    body: 'The app contains no advertising SDKs and no third-party trackers. The only product analytics are first-party, on our own servers, and you can turn them off.',
  },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <div className="container hero-grid">
          <div style={{ maxWidth: '42rem', display: 'grid', gap: '1.5rem' }}>
            <span className="eyebrow">Food &amp; fitness tracking</span>
            <h1>{TAGLINE}</h1>
            <p className="muted" style={{ fontSize: '1.1875rem', maxWidth: '36rem' }}>
              Lumo is a food and fitness tracker built on one idea: tell the truth. Calorie
              estimates with confidence ranges instead of invented precision, gym tracking without
              guilt mechanics, and health data that stays yours.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="chip chip--soon">
                <span className="dot" aria-hidden />
                Coming soon to the App&nbsp;Store
              </span>
              <TrackedLink
                event="cta_notify_click"
                className="btn-secondary"
                href={`mailto:${SUPPORT_EMAIL}?subject=Tell%20me%20when%20Lumo%20launches`}
              >
                Email me at launch
              </TrackedLink>
            </div>
          </div>
          {/* How Lumo sees a plate — the measurement view, quiet and precise. */}
          <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '26rem', width: '100%', justifySelf: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow">How Lumo sees lunch</span>
              <span className="confidence">
                <span className="dot" style={{ background: 'var(--warn)' }} aria-hidden />
                48% · medium
              </span>
            </div>
            <PlateGeometry />
            <p className="mono muted" style={{ fontSize: 'var(--text-mono-micro)' }}>
              measured, not vibes · 585±65 kcal
            </p>
          </div>
        </div>
      </section>

      {/* ── Signature: the same plate, told honestly ─────────────────────── */}
      <section className="section zone" aria-labelledby="honest-numbers">
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div style={{ maxWidth: '38rem', display: 'grid', gap: '0.9rem' }}>
            <span className="eyebrow">The same plate, told honestly</span>
            <h2 id="honest-numbers">Every tracker gives you a number. Ours tells you how much to trust it.</h2>
            <p className="muted">
              This is the actual shape of a Lumo scan: measured portions, a range, a confidence
              level, and a nudge to confirm the one thing it&apos;s least sure about.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))',
              alignItems: 'start',
              maxWidth: '52rem',
            }}
          >
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <FalsePrecisionCard />
              <p className="muted" style={{ fontSize: 'var(--text-small)', paddingInline: '0.25rem' }}>
                A single confident number. It&apos;s a guess wearing a checkmark.
              </p>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <ScanReviewCard />
              <p className="muted" style={{ fontSize: 'var(--text-small)', paddingInline: '0.25rem' }}>
                Lumo measures the plate, states its confidence, and asks when it isn&apos;t sure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="section" id="features" aria-labelledby="features-h">
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div style={{ maxWidth: '38rem', display: 'grid', gap: '0.9rem' }}>
            <span className="eyebrow">What it does</span>
            <h2 id="features-h">Everything a tracker should do. Nothing it shouldn&apos;t.</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gap: '1.25rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(19rem, 100%), 1fr))',
            }}
          >
            {FEATURES.map((f) => (
              <article key={f.title} className="card" style={{ padding: '1.35rem', display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
                <h3>{f.title}</h3>
                <p className="muted" style={{ fontSize: 'var(--text-small)' }}>
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── App showcase ─────────────────────────────────────────────────── */}
      <section className="section zone" aria-labelledby="showcase-h">
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div style={{ maxWidth: '38rem', display: 'grid', gap: '0.9rem' }}>
            <span className="eyebrow">Inside the app</span>
            <h2 id="showcase-h">Quiet screens, working numbers.</h2>
            <p className="muted">
              Recreated here as illustrations — monochrome surfaces, colour only where it means
              something, every number in a face built for data.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(19rem, 100%), 1fr))',
              alignItems: 'start',
            }}
          >
            <FoodDayCard />
            <EnergyBalanceCard />
            <GymCheckinCard />
          </div>
        </div>
      </section>

      {/* ── Honesty thesis ───────────────────────────────────────────────── */}
      <section className="section" id="honesty" aria-labelledby="honesty-h">
        <div className="container" style={{ display: 'grid', gap: '2.5rem' }}>
          <div style={{ maxWidth: '38rem', display: 'grid', gap: '0.9rem' }}>
            <span className="eyebrow">Why Lumo</span>
            <h2 id="honesty-h">Built for people who are tired of being lied to by their tracker.</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gap: '2rem 3rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(19rem, 100%), 1fr))',
              maxWidth: '52rem',
            }}
          >
            {THESIS.map((t) => (
              <div key={t.title} style={{ display: 'grid', gap: '0.4rem', alignContent: 'start' }}>
                <h3>{t.title}</h3>
                <p className="muted" style={{ fontSize: 'var(--text-small)' }}>
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <section className="section zone">
        <div className="container" style={{ display: 'grid', gap: '1.25rem', justifyItems: 'start', maxWidth: '44rem' }}>
          <h2>Coming soon to the App&nbsp;Store.</h2>
          <p className="muted">
            Lumo is in the final stretch before launch. If you&apos;d like a single email when
            it&apos;s live — and nothing else — say hello.
          </p>
          <TrackedLink
            event="cta_notify_click"
            className="btn-secondary"
            href={`mailto:${SUPPORT_EMAIL}?subject=Tell%20me%20when%20Lumo%20launches`}
          >
            Email me at launch
          </TrackedLink>
          <p className="muted" style={{ fontSize: 'var(--text-mono-micro)' }}>
            <span className="mono">No mailing list, no drip campaign. One email, sent by a human.</span>
          </p>
        </div>
      </section>

      {/* SoftwareApplication + Organization structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'MobileApplication',
              name: SITE_NAME,
              operatingSystem: 'iOS',
              applicationCategory: 'HealthApplication',
              description: DESCRIPTION,
              url: SITE_URL,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free download with optional subscription; 7-day free trial.' },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              email: SUPPORT_EMAIL,
              location: 'Adelaide, South Australia, Australia',
            },
          ]),
        }}
      />
    </>
  );
}
