import Link from 'next/link';

/* The right-hand slot is a STATUS READOUT, not a button.
   Lume is not on the App Store, so a badge would be a dead link and a broken
   promise to every visitor who clicks it. When the app ships, this is where the
   real App Store badge goes — grep `status__dot` to find every place that has
   to change on launch day. */
export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="wordmark" aria-label="Lume home">
          Lume
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/#features">Features</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
        </nav>
        <span className="status site-header__status">
          <span className="status__dot" aria-hidden />
          Coming soon
        </span>
      </div>
    </header>
  );
}
