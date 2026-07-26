import { ImageResponse } from 'next/og';

import { TAGLINE } from '@/lib/site';

export const dynamic = 'force-static';

export const alt = `Lumo — ${TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generated at build time (static export). Monochrome, one functional accent —
// the same restraint as the product.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          color: '#1C1C1E',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
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
            }}
          >
            L
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>Lumo</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>
            {TAGLINE}
          </div>
          <div style={{ fontSize: 30, color: '#6B6B6B' }}>
            Honest calorie tracking · confidence, not fake precision
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, color: '#6B6B6B' }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: '#67CE67' }} />
          Coming soon to the App Store
        </div>
      </div>
    ),
    size,
  );
}
