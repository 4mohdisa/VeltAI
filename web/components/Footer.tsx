import Link from 'next/link';

import { SUPPORT_EMAIL } from '@/lib/site';

export function Footer() {
  return (
    <footer className="site-footer">
      <div
        className="container"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between' }}
      >
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ink-strong)', marginBottom: '0.35rem' }}>Lumo</div>
          <p style={{ maxWidth: '22rem' }}>
            Food and fitness tracking that tells you the truth. Coming soon to the App&nbsp;Store.
          </p>
        </div>
        <nav aria-label="Footer" style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
            <span className="eyebrow">Product</span>
            <Link href="/#features">Features</Link>
            <Link href="/#honesty">Why Lumo</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
            <span className="eyebrow">Company</span>
            <Link href="/support">Support</Link>
            <Link href="/security">Security &amp; privacy</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
            <span className="eyebrow">Legal</span>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of service</Link>
          </div>
        </nav>
      </div>
      <div className="container" style={{ marginTop: '2.5rem', fontSize: 'var(--text-mono-micro)' }}>
        <span className="mono">© {new Date().getFullYear()} Lumo · Adelaide, South Australia</span>
      </div>
    </footer>
  );
}
