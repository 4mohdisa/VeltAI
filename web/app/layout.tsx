import type { Metadata } from 'next';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ConsentAnalytics } from '@/components/ConsentAnalytics';
import { DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE } from '@/lib/site';
import './globals.css';

/* NO WEBFONTS.
   The app is set in San Francisco. On the web the system stack resolves to the
   real SF on Apple devices — the same typeface, not an approximation — and
   `ui-rounded` gives us SF Pro Rounded for the numerals, which is the face the
   app uses for every stat. See app/tokens.css.

   This replaced Hanken Grotesk + IBM Plex Mono from Google Fonts: two faces the
   app does not contain, two render-blocking fetches, and a font-swap reflow on
   every cold load. Removing them is better type parity AND better Core Web
   Vitals, which is a rare direction for that trade to run. */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    url: SITE_URL,
    // A committed .png, not an opengraph-image route: a static export writes
    // that route to an extensionless file, which static hosts serve as
    // octet-stream and crawlers ignore. Regenerate: node scripts/make-og.mjs
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE_NAME} — ${TAGLINE}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <ConsentAnalytics />
      </body>
    </html>
  );
}
