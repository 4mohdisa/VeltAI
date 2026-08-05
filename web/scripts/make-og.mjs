// Renders public/og.png (1200×630), the Open Graph / Twitter card image.
//
// Why a committed asset instead of an app/opengraph-image route: with
// `output: 'export'` the route exports to a file literally named
// "opengraph-image" — no extension — which static hosts (Vercel static, S3,
// nginx) serve as application/octet-stream, and social crawlers ignore. A real
// .png is correct everywhere and needs no build-time rasterization.
//
// Run after changing the tagline or the card design:
//   cd web && node scripts/make-og.mjs
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createElement as h } from 'react';

// next/og is CJS-only (no exports map) — plain ESM import can't resolve it.
const { ImageResponse } = createRequire(import.meta.url)('next/og');

// The page's h1. Kept in step with app/page.tsx by hand — if the headline
// changes there, re-run this script.
const TAGLINE = 'Confidently wrong is still wrong.';

const card = h(
  'div',
  {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: '#ffffff',
      color: '#1C1C1E',
      padding: 72,
      fontFamily: 'sans-serif',
    },
  },
  h('div', { style: { display: 'flex', alignItems: 'center', gap: 18 } }, [
    h(
      'div',
      {
        key: 'mark',
        style: {
          width: 56,
          height: 56,
          borderRadius: 14,
          background: '#1C1C1E',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 800,
        },
      },
      'L',
    ),
    h('div', { key: 'word', style: { fontSize: 40, fontWeight: 800 } }, 'Lume'),
  ]),
  h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } }, [
    h(
      'div',
      {
        key: 'tagline',
        style: { fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 },
      },
      TAGLINE,
    ),
    h(
      'div',
      { key: 'sub', style: { fontSize: 30, color: '#6B6B6B' } },
      'Honest calorie tracking. Confidence, not fake precision.',
    ),
  ]),
  h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, color: '#6B6B6B' } }, [
    h('div', { key: 'dot', style: { width: 12, height: 12, borderRadius: 12, background: '#67CE67' } }),
    h('div', { key: 'label' }, 'Coming soon to the App Store'),
  ]),
);

const png = Buffer.from(
  await new ImageResponse(card, { width: 1200, height: 630 }).arrayBuffer(),
);
writeFileSync(new URL('../public/og.png', import.meta.url), png);
console.log(`wrote public/og.png (${png.length} bytes)`);
