# Lumo — Landing Page & Analytics Report (2026-07-26)

**Built:** the `/web` marketing site (6 pages, fully static), consent-gated site
GA4, first-party in-app product analytics (app module + Go endpoint + migration),
and the open-source entry docs. Everything verified green and pushed.

## What was built

| Piece | Where |
|---|---|
| Marketing site (/, /privacy, /terms, /faq, /support, /security) | `web/` — Next.js 16, App Router, static export |
| SEO (metadata, canonicals, OG image route, robots, sitemap, JSON-LD ×3) | `web/app/*` |
| Site analytics (GA4, consent + DNT-gated) | `web/components/ConsentAnalytics.tsx` |
| App analytics module (typed, batched, opt-out, offline-safe) | `src/lib/analytics/` + settings toggle in Settings → Privacy |
| Analytics endpoint + storage | `backend/internal/analytics/`, migration `20260727000001` (RLS) |
| Open-source docs | `CONTRIBUTING.md`, `SECURITY.md`, `.github/pull_request_template.md` |

## Design rationale (why it isn't a template)

- **Identity from the product, not a kit.** The palette is lifted from the app's
  tokens (ink `#171717`, card `#F2F2F7`, line `#E5E5EA`, secondary `#6B6B6B`;
  accents only ever mean something — energy, positive, data, warn, AI). The
  site's single indulgence is a warm section background (`#F6F5F2`).
- **Type**: Hanken Grotesk (calm, precise, not the AI-default serif-and-terracotta
  look) + **IBM Plex Mono for every number and label** — data set in an
  instrument face is the visual argument for "we measure, we don't market".
- **Signature element — "the same plate, told honestly."** Other apps' output
  (one smug number: "643 kcal ✓") sits next to Lumo's real scan shape: the
  geometry view of the plate (regions + grams, exactly how the pipeline sees
  it), a range (585±65), a visible confidence badge, and a nudge to confirm the
  least-certain item. The hero shows the plate view alone ("How Lumo sees
  lunch · measured, not vibes"). Everything else stays quiet.
- **Honesty enforced in the details**: the confidence badge was corrected in
  review from "78% · medium" to "48% · medium" because 78 is a HIGH-band score
  in the real product — the marketing may not contradict the system it praises.
- Quality floor: responsive (mobile header verified), semantic HTML, one h1 per
  page, visible focus, `prefers-reduced-motion` respected, AA-checked greys.

## SEO / GA

- Per-page Metadata (title/description/canonical), OG + Twitter cards, build-time
  OG image, `robots.ts` + `sitemap.ts`, JSON-LD: MobileApplication + Organization
  (landing), FAQPage (/faq). All 12 routes prerendered static; fonts self-hosted
  via next/font (no runtime Google requests).
- GA4 loads only when `NEXT_PUBLIC_GA_ID` is set **and** the visitor accepts the
  one-line consent note **and** DNT/GPC is off. Unset ⇒ nothing loads, no banner,
  clean dev. Tracked: page views + the two "Email me at launch" CTA clicks.
- CTA is an honest **"Coming soon" chip + mailto** — no dead Download button, no
  email-capture backend.

## App analytics — why first-party

The app's privacy policy says "no advertising or tracking SDKs". A
Mixpanel/Amplitude SDK would make that false, so behaviour analytics go to OUR
backend: `track()` → batched → `POST /api/analytics/events` (Clerk-authed) →
`analytics_events` in Supabase (RLS owner-only, cascade on account deletion).
12 allow-listed event names, validated on both sides; properties are scalar tags
(≤2KB), never PII; user id comes only from the verified token. Buffering matches
the offline-queue pattern (cap 200, persisted across restarts, flush on launch);
`track()` can never throw or block UI. Funnels/feature usage are one SQL query
away in Supabase, and the typed schema is the clean seam if a heavier tool is
ever wanted.

**Opt-out**: one toggle (Settings → Privacy), honoured at every entry point, and
**persisted** — the adversarial review caught that a restart or sign-out would
have silently re-enabled collection; the flag now lives in secure-store and
`reset()` deliberately leaves it alone. Both privacy policies (in-app + site)
document the system truthfully.

Not instrumented (honest gaps): `trial_started` (the hosted paywall doesn't
distinguish trial vs purchase client-side — RevenueCat's webhook/dashboard has
this data) and `feature_used` (no single seam; wire per-feature when wanted).

## Verification

| Check | Result |
|---|---|
| web: next build (static export) / eslint / tsc | 12 routes ✓ / clean / clean |
| app: tsc / eslint / jest | clean / 0 errors / **312 passed** (was 303) |
| backend: build / vet / gofmt / go test | all clean, 24 packages |
| Route coverage | **83/83 (100%)** (new analytics endpoint consumed by the app) |
| Internal links on the built site | all resolve |
| Mobile responsive | verified at 375px (header fixed during review) |

## Deploying the site on AWS

The build output is a plain static folder — see `web/README.md` for both paths:

```bash
cd web
NEXT_PUBLIC_SITE_URL=https://<your-domain> NEXT_PUBLIC_GA_ID=G-XXXX npm run build
aws s3 sync out/ s3://<bucket> --delete   # S3+CloudFront
# or copy out/ to nginx with: try_files $uri $uri/index.html =404;
```

## Remaining human steps

1. **Domain**: pick the real domain and set `NEXT_PUBLIC_SITE_URL` (the code
   defaults to `https://lumo.fit`; note the app's Settings → Privacy links still
   point at `veltai.app/*` — align them when the domain is chosen).
2. **GA**: create the GA4 property, set `NEXT_PUBLIC_GA_ID` at build time.
3. **App Store link**: when Lumo is live, replace the "Coming soon" chips with
   the real badge/link (grep `chip--soon`).
4. **License**: the repo has no real license (LICENSE is Expo boilerplate =
   all-rights-reserved). Pick one before any open-sourcing — owner's call.
5. Apply migration `20260727000001_analytics_events.sql` with the others at
   deploy time (`supabase db push`).
