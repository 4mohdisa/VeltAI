// Illustrative recreation of the app's scan-review card: the geometry view of a
// plate (how the pipeline actually sees it — regions, not vibes), per-item
// weights, a calorie RANGE, and a visible confidence badge. Faithful to the app
// design: light1 card, 20px radius, mono numerals, accents only as data dots.

export function PlateGeometry() {
  return (
    <svg
      viewBox="0 0 220 160"
      role="img"
      aria-label="Diagram of a scanned plate: outlined regions for rice, chicken curry and salad, as the scan pipeline measures them"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* plate */}
      <ellipse cx="110" cy="80" rx="96" ry="62" fill="#fff" stroke="#d1d1d6" strokeWidth="1.5" />
      <ellipse cx="110" cy="80" rx="82" ry="52" fill="none" stroke="#e5e5ea" strokeWidth="1" />
      {/* rice region */}
      <path
        d="M60 88c-4-14 6-28 22-30 15-2 28 6 30 18 2 13-8 24-24 26-14 2-24-4-28-14z"
        fill="#f2f2f7"
        stroke="#6b6b6b"
        strokeWidth="1.3"
        strokeDasharray="4 3"
      />
      {/* curry region */}
      <path
        d="M124 62c14-6 32-2 38 8 6 11-2 24-16 28-13 4-27-2-30-12-3-9 0-19 8-24z"
        fill="#f2f2f7"
        stroke="#6b6b6b"
        strokeWidth="1.3"
        strokeDasharray="4 3"
      />
      {/* salad region */}
      <path
        d="M92 112c10-4 22-2 26 4 4 7-2 14-12 16-9 2-18-2-20-8-2-5 1-10 6-12z"
        fill="#f2f2f7"
        stroke="#8a8a8a"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />
      {/* measurement ticks */}
      <line x1="60" y1="88" x2="112" y2="76" stroke="#8a8a8a" strokeWidth="0.75" />
      <line x1="124" y1="62" x2="162" y2="98" stroke="#8a8a8a" strokeWidth="0.75" />
      <g fontFamily="var(--font-plex-mono), monospace" fontSize="8.5" fill="#6b6b6b">
        <text x="64" y="56">rice · 212g</text>
        <text x="138" y="54">curry · 180g</text>
        <text x="96" y="142">salad · 45g</text>
      </g>
    </svg>
  );
}

export function ScanReviewCard() {
  return (
    <div className="card-elevated" style={{ display: 'grid', gap: '0.9rem', padding: '1.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <span className="eyebrow">Scan review</span>
        {/* 48 sits in the product's real Medium band (35–54) — the badge must
            not contradict the confidence system it's advertising. */}
        <span className="confidence">
          <span className="dot" style={{ background: 'var(--warn)' }} aria-hidden />
          48% · medium
        </span>
      </div>

      <PlateGeometry />

      <div style={{ display: 'grid', gap: '0.45rem', fontSize: 'var(--text-small)' }}>
        {[
          ['Basmati rice', '212 g', '276 kcal'],
          ['Chicken curry', '180 g', '291 kcal'],
          ['Side salad', '45 g', '18 kcal'],
        ].map(([name, grams, kcal]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span>{name}</span>
            <span className="mono muted">
              {grams} · {kcal}
            </span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--line)',
            paddingTop: '0.55rem',
            marginTop: '0.2rem',
            fontWeight: 600,
          }}
        >
          <span>Estimate</span>
          <span className="mono">585±65 kcal</span>
        </div>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.7rem 0.9rem',
          fontSize: 'var(--text-small)',
        }}
      >
        <span>
          Rice portion is the least certain — <strong>tap to confirm</strong>
        </span>
        <span className="mono muted" aria-hidden>
          →
        </span>
      </div>
    </div>
  );
}

// The deadpan foil: what false precision looks like.
export function FalsePrecisionCard() {
  return (
    <div
      className="card"
      style={{ display: 'grid', gap: '0.8rem', padding: '1.35rem', border: '1px solid var(--line)', background: 'var(--paper)' }}
    >
      <span className="eyebrow">Other apps</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
        <span style={{ fontWeight: 600 }}>Chicken curry with rice</span>
        <span className="mono" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          643
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)' }} className="muted">
        <span>Logged ✓</span>
        <span className="mono">kcal, apparently</span>
      </div>
    </div>
  );
}
