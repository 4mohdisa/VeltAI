// Illustrative recreations of key app surfaces as clean web components — the
// same visual language as the app (light1 cards, mono numerals, functional
// accent dots), clearly explanatory rather than screenshots.

const bar = (fill: string, pct: number) => (
  <span
    aria-hidden
    style={{
      display: 'block',
      height: 6,
      borderRadius: 999,
      background: 'var(--line)',
      overflow: 'hidden',
      flex: 1,
    }}
  >
    <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 999, background: fill }} />
  </span>
);

export function FoodDayCard() {
  return (
    <div className="card-elevated" style={{ display: 'grid', gap: '0.9rem', padding: '1.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow">Today</span>
        <span className="mono muted" style={{ fontSize: 'var(--text-mono-micro)' }}>
          1,438 / 2,100 kcal
        </span>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem', fontSize: 'var(--text-small)' }}>
        {[
          ['Breakfast', 'Oats, banana, coffee', '412'],
          ['Lunch', 'Chicken curry + rice (scanned)', '585'],
          ['Snack', 'Greek yoghurt', '441'],
        ].map(([meal, what, kcal]) => (
          <div key={meal} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span>
              <strong style={{ fontWeight: 600 }}>{meal}</strong>{' '}
              <span className="muted">· {what}</span>
            </span>
            <span className="mono muted">{kcal}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: '0.45rem', fontSize: 'var(--text-mono-micro)' }} className="mono muted">
        {(
          [
            ['Protein', 'var(--energy)', 72, '96/134g'],
            ['Carbs', 'var(--warn)', 58, '141/244g'],
            ['Fat', 'var(--data)', 46, '32/70g'],
          ] as const
        ).map(([label, fill, pct, val]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 52 }}>{label}</span>
            {bar(fill, pct)}
            <span>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EnergyBalanceCard() {
  return (
    <div className="card-elevated" style={{ display: 'grid', gap: '0.9rem', padding: '1.35rem' }}>
      <span className="eyebrow">Energy balance</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span className="mono" style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
          −312
        </span>
        <span className="muted small">kcal today</span>
      </div>
      <div style={{ display: 'grid', gap: '0.45rem', fontSize: 'var(--text-mono-micro)' }} className="mono muted">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: 32 }}>In</span>
          {bar('var(--secondary)', 68)}
          <span>1,438</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: 32 }}>Out</span>
          {bar('var(--energy)', 83)}
          <span>1,750</span>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 'var(--text-small)' }}>
        Burn is computed per exercise from published ACSM equations — and it shows its working.
      </p>
    </div>
  );
}

export function GymCheckinCard() {
  return (
    <div className="card-elevated" style={{ display: 'grid', gap: '0.85rem', padding: '1.35rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow">Gym · Tuesday</span>
        <span className="mono muted" style={{ fontSize: 'var(--text-mono-micro)' }}>
          streak 12
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Pull day</div>
          <div className="muted small">5 exercises · planned 45 min</div>
        </div>
        <span className="chip" style={{ background: 'var(--ink-strong)', color: 'var(--paper)' }}>
          Check in
        </span>
      </div>
      <div style={{ display: 'grid', gap: '0.4rem', fontSize: 'var(--text-small)', borderTop: '1px solid var(--line)', paddingTop: '0.7rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Rowing · 2:05 /500m split</span>
          <span className="mono muted">184 kcal</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Treadmill · 8.5 km/h, 2% incline</span>
          <span className="mono muted">236 kcal</span>
        </div>
        <div className="muted" style={{ fontSize: 'var(--text-mono-micro)' }}>
          <span className="mono">ACSM equations · shows the math</span>
        </div>
      </div>
    </div>
  );
}
