import Link from 'next/link';

export function Header() {
  return (
    <header className="site-header">
      <div className="container inner">
        <Link href="/" className="wordmark" aria-label="Lumo home">
          Lumo
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/#features">Features</Link>
          <Link href="/#honesty">Why Lumo</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/support">Support</Link>
          <span className="chip chip--soon">
            <span className="dot" aria-hidden />
            Coming soon
          </span>
        </nav>
      </div>
    </header>
  );
}
