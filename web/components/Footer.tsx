import Link from 'next/link';

import { SUPPORT_EMAIL } from '@/lib/site';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__col">
            <span className="wordmark">Lumo</span>
            <p style={{ maxWidth: '26ch' }}>
              Food and fitness tracking that tells you how sure it is.
            </p>
            <span className="status">
              <span className="status__dot" aria-hidden />
              Coming soon to the App&nbsp;Store
            </span>
          </div>

          <nav className="site-footer__col" aria-label="Product">
            <span className="eyebrow">Product</span>
            <Link href="/#features">Features</Link>
            <Link href="/#honesty">The method</Link>
            <Link href="/#privacy">Privacy summary</Link>
          </nav>

          <nav className="site-footer__col" aria-label="Company">
            <span className="eyebrow">Company</span>
            <Link href="/faq">FAQ</Link>
            <Link href="/support">Support</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </nav>

          <nav className="site-footer__col" aria-label="Legal">
            <span className="eyebrow">Legal</span>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of service</Link>
            <Link href="/security">Security</Link>
          </nav>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Lumo · Adelaide, South Australia</span>
          <span>Not affiliated with Apple Inc.</span>
        </div>
      </div>
    </footer>
  );
}
