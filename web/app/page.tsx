import type { Metadata } from 'next';
import Link from 'next/link';

import { ScrollScreens } from '@/components/ScrollScreens';
import { PhoneFrame } from '@/components/device/PhoneFrame';
import { ScanReviewScreen } from '@/components/device/screens';
import { TrackedLink } from '@/components/TrackedLink';
import { Faq } from '@/components/Faq';
import { CORE } from '@/lib/faq';
import { DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_EMAIL, TAGLINE } from '@/lib/site';

export const metadata: Metadata = {
  // absolute: the layout's "%s · Lumo" template would double the brand here.
  title: { absolute: `${SITE_NAME} — ${TAGLINE}` },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
};

/* Everything below is checked against the implementation. Where a capability
   is built but not switched on (Strava, WHOOP), it says so rather than
   appearing in the list as though it works. */

type Spec = { term: string; desc: string; tier: string };

const CAPTURE: Spec[] = [
  {
    term: 'Barcode',
    desc: 'Scan a packaged product and log the manufacturer’s own numbers, from Open Food Facts or the USDA FoodData Central database. Nothing is estimated.',
    tier: 'Free',
  },
  {
    term: 'Nutrition label',
    desc: 'Photograph the nutrition facts panel and Lumo reads the printed values into an entry you check and confirm before it saves.',
    tier: 'Free',
  },
  {
    term: 'Photo',
    desc: 'Estimate a whole plate from a photo, with a confidence score attached. One to three angles; more angles let it cross-check itself.',
    tier: '3 a day free',
  },
  {
    term: 'Search, quick add, recipes',
    desc: 'Type it, save it, or build a recipe once and log it as a unit. Portions you use repeatedly are remembered.',
    tier: 'Free',
  },
];

const ENGINE: Spec[] = [
  {
    term: 'Cuisine library',
    desc: 'A reference library of foods across eight cuisine groups — South Asian, East Asian, Southeast Asian, Middle Eastern, Mediterranean, Western, African and Latin American. A scan that matches one uses its real per-100g values instead of an estimate, and says so.',
    tier: 'Free',
  },
  {
    term: 'Learns your portions',
    desc: 'Correct a weight and Lumo folds the correction into a per-food multiplier, applied to your future scans once it has seen enough of them. Your most-logged dishes and past misidentifications are fed into the next scan.',
    tier: 'Free',
  },
  {
    term: 'Cardio maths',
    desc: 'Treadmill, bike, rower and stair climber burn are computed from the published ACSM metabolic equations using the speed, incline, watts or split time you enter. Strength work uses a coarser MET estimate, and is not dressed up as more.',
    tier: 'Free',
  },
  {
    term: 'Energy balance',
    desc: 'Calories in against BMR plus the exercise you logged, daily and weekly. When your body stats are missing it says the net is unknown rather than inventing one.',
    tier: 'Free',
  },
  {
    term: 'Gym scheduling and streaks',
    desc: 'An exercise library, reusable templates, a weekly schedule, and check-in. Miss a day and you can spend your one streak freeze instead of losing the streak.',
    tier: 'Free',
  },
  {
    term: 'AI insights',
    desc: 'Patterns worth knowing, a morning brief, and questions you can ask about your own logged data. The AI writes the wording; it never does the arithmetic.',
    tier: 'Pro',
  },
  {
    term: 'Export and deletion',
    desc: 'Take everything out in a machine-readable file whenever you like. Delete the account and it is gone immediately — identity first, then every row, no grace period.',
    tier: 'Free',
  },
];

const METHOD = [
  {
    h: 'Geometry constrains the guess',
    p: 'The estimate is anchored to the scene rather than to a name. A plate found in the frame gives the image a scale, and the portion is derived from what that scale implies — not from the average serving of a dish someone once typed into a database.',
  },
  {
    h: 'The confidence is shown, not buried',
    p: 'Every photo estimate carries a score out of 100, built from conditions that can actually be checked: sharpness, lighting, whether a plate was found, whether the macros came from a real database or from the model. A single angle is capped part-way up the scale, because one angle cannot see depth.',
  },
  {
    h: 'Disagreement is surfaced, not averaged',
    p: 'Add a second angle and Lumo estimates it independently, then compares. Agreement raises the confidence. Disagreement shows you both numbers and asks which is right — the moment where most software would quietly pick one and move on.',
  },
  {
    h: 'Corrections train it on you',
    p: 'When you fix a portion, that correction becomes a multiplier for that food, for you, applied to later scans. The system gets more accurate for your kitchen and your hand, which is the only kind of accurate that helps.',
  },
  {
    h: 'Read the label rather than guess at it',
    p: 'Packaged food is a solved problem, so Lumo solves it that way: barcode and nutrition-label scanning return printed values. Estimation is reserved for the cases that genuinely require it.',
  },
];

const NEGATIVES = [
  'No advertising SDKs and no third-party trackers in the app.',
  'No notifications. None at all — no streak-shaming, no manufactured urgency.',
  'Your health data is never sold and never used for advertising.',
  'No number is presented as more certain than it is.',
  'No dark patterns around cancelling, and no data held hostage — export whenever you like.',
];

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__text">
            <p className="eyebrow">Food &amp; fitness tracking · iOS</p>
            <h1>Confidently wrong is still wrong.</h1>
            <p className="lead hero__lead">
              Every calorie app will give you a number for that plate. Lumo gives you the number
              and how much to trust it — and when two camera angles disagree, it shows you both
              instead of quietly picking one.
            </p>

            {/* The signature: a dimension line, as on an engineering drawing.
                One hairline and one type token, saying what the product is. */}
            <div className="dimension" aria-hidden>
              <div className="dimension__line" />
              <p className="eyebrow" style={{ letterSpacing: '0.09em' }}>
                Estimate · confidence · your correction
              </p>
            </div>

            <div className="hero__meta">
              <span className="status">
                <span className="status__dot" aria-hidden />
                Coming soon to the App&nbsp;Store
              </span>
              <TrackedLink
                event="cta_notify_click"
                className="action"
                href={`mailto:${SUPPORT_EMAIL}?subject=Tell%20me%20when%20Lumo%20launches`}
              >
                Email me at launch
              </TrackedLink>
            </div>
          </div>

          <div className="hero__figure">
            <PhoneFrame width={340} aria-hidden>
              <ScanReviewScreen settle={1} />
            </PhoneFrame>
            <p className="eyebrow caption">Scan review · illustrative</p>
          </div>
        </div>
      </section>

      {/* ── What it does — pinned device, scroll-linked screens ──────────── */}
      <section className="section section--zone" id="features" aria-labelledby="features-h">
        <div className="container">
          <div className="head">
            <p className="eyebrow">What it does</p>
            <h2 id="features-h">Four things, done properly.</h2>
            <p className="lead">
              The screens beside this text are the real interface, rebuilt from the app’s own
              design tokens. The numbers in them are illustrative — one made-up day, consistent
              across all four — not anyone’s data.
            </p>
          </div>
          <ScrollScreens />
        </div>
      </section>

      {/* ── Specification ────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="spec-h">
        <div className="container split">
          <div className="head">
            <p className="eyebrow">Specification</p>
            <h2 id="spec-h">Everything in the box.</h2>
            <p className="lead small">
              What is free is free because it should be, not to bait an upgrade. The tier is
              enforced on the server, so it means the same thing on every device.
            </p>
          </div>

          <div>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Getting food in</h3>
            <dl className="spec">
              {CAPTURE.map((s) => (
                <div className="spec__row" key={s.term}>
                  <dt className="spec__term">{s.term}</dt>
                  <dd className="spec__desc">{s.desc}</dd>
                  <dd className="spec__tier">{s.tier}</dd>
                </div>
              ))}
            </dl>

            <h3 style={{ margin: 'var(--space-5xl) 0 var(--space-lg)' }}>What it does with it</h3>
            <dl className="spec">
              {ENGINE.map((s) => (
                <div className="spec__row" key={s.term}>
                  <dt className="spec__term">{s.term}</dt>
                  <dd className="spec__desc">{s.desc}</dd>
                  <dd className="spec__tier">{s.tier}</dd>
                </div>
              ))}
            </dl>

            {/* Built, not live. Saying so is the whole point of the page. */}
            <p className="muted small" style={{ marginTop: 'var(--space-2xl)', maxWidth: 'var(--measure)' }}>
              <span className="mono" style={{ textTransform: 'uppercase', fontSize: 'var(--web-micro)', letterSpacing: '0.09em' }}>
                Not yet ·{' '}
              </span>
              Strava and WHOOP importing is written but not switched on, and Lumo has no Apple
              Health integration at all. Today the exercise side of your energy balance comes from
              workouts you log in Lumo itself.
            </p>
          </div>
        </div>
      </section>

      {/* ── The honesty argument — this is where a normal page puts reviews ─ */}
      <section className="section section--invert" id="honesty" aria-labelledby="honesty-h">
        <div className="container split">
          <div className="head">
            <p className="eyebrow">The method</p>
            <h2 id="honesty-h">Why we show you the uncertainty.</h2>
            <p className="lead small" style={{ color: 'var(--ink-tertiary)' }}>
              A photograph cannot tell you the density of what is under the sauce. That is a fact
              about optics, not a failure of engineering — and an app that hides it behind one
              confident figure has decided that looking authoritative matters more than being
              useful.
            </p>
          </div>

          <div>
            <div className="method">
              {METHOD.map((m) => (
                <div className="method__item" key={m.h}>
                  <h3>{m.h}</h3>
                  <p>{m.p}</p>
                </div>
              ))}
            </div>

            <h3 style={{ margin: 'var(--space-5xl) 0 var(--space-md)' }}>And what it does not do</h3>
            <ul className="negatives">
              {NEGATIVES.map((n) => (
                <li key={n}>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Privacy ──────────────────────────────────────────────────────── */}
      <section className="section" id="privacy" aria-labelledby="privacy-h">
        <div className="container split">
          <div className="head">
            <p className="eyebrow">Privacy</p>
            <h2 id="privacy-h">What leaves your phone, and what never does.</h2>
          </div>

          <div className="stack-lg">
            <dl className="spec">
              <div className="spec__row">
                <dt className="spec__term">Meal and label photos</dt>
                <dd className="spec__desc">
                  Sent to Google Gemini to be analysed, and only after you have agreed to it. Lumo
                  keeps a quality score and the geometry it derived — not the photograph.
                </dd>
                <dd className="spec__tier">Leaves</dd>
              </div>
              <div className="spec__row">
                <dt className="spec__term">A summary of your logs</dt>
                <dd className="spec__desc">
                  Sent to Anthropic to write the wording of insights, again only with your
                  agreement. The server refuses to send anything until that agreement is on record,
                  and you can withdraw it.
                </dd>
                <dd className="spec__tier">Leaves</dd>
              </div>
              <div className="spec__row">
                <dt className="spec__term">Your food, workouts and body data</dt>
                <dd className="spec__desc">
                  Stored scoped to you at the database level — one account cannot read another’s
                  rows. Never sold, never shared for advertising, never shown to other users.
                </dd>
                <dd className="spec__tier">Stays</dd>
              </div>
              <div className="spec__row">
                <dt className="spec__term">Anything to an advertiser</dt>
                <dd className="spec__desc">
                  There is nothing to send it with. The app contains no advertising SDKs and no
                  third-party trackers.
                </dd>
                <dd className="spec__tier">Never</dd>
              </div>
            </dl>

            <p className="muted small measure">
              Deleting your account is immediate: your sign-in identity goes first, then every row
              of your data. If the identity deletion fails the operation stops and reports it
              rather than leaving you deleted-but-signed-in.{' '}
              <Link href="/privacy">Read the privacy policy</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="section section--zone" id="faq" aria-labelledby="faq-h">
        <div className="container split">
          <div className="head">
            <p className="eyebrow">Questions</p>
            <h2 id="faq-h">The ones worth asking.</h2>
            <p className="lead small">
              Including the two most apps avoid: how accurate is it really, and what does it not
              do yet.
            </p>
          </div>
          <div>
            <Faq items={CORE} />
            <p className="muted small" style={{ marginTop: 'var(--space-2xl)' }}>
              <Link href="/faq">More questions</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="close-h">
        <div className="container stack-lg" style={{ maxWidth: '44rem' }}>
          <h2 id="close-h">Not out yet.</h2>
          <p className="lead">
            Lumo is still in development and is not on the App&nbsp;Store. There is no waitlist and
            no mailing list — if you want to know when it is live, send an email and you will get
            exactly one back.
          </p>
          <TrackedLink
            event="cta_notify_click"
            className="action"
            href={`mailto:${SUPPORT_EMAIL}?subject=Tell%20me%20when%20Lumo%20launches`}
          >
            Email me at launch
          </TrackedLink>
        </div>
      </section>

      {/* Structured data. No aggregateRating and no review — Lumo has no
          ratings and no reviews, and inventing them for rich snippets is both
          a lie and a manual action waiting to happen. */}
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
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'AUD',
                description:
                  'Free tier with unlimited manual, search and barcode logging, label scanning, three photo scans a day and all gym features. Optional Pro subscription with a 7-day free trial.',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              email: SUPPORT_EMAIL,
              location: 'Adelaide, South Australia, Australia',
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: CORE.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a.join(' ') },
              })),
            },
          ]),
        }}
      />
    </>
  );
}
