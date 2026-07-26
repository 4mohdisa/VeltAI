import type { Metadata } from 'next';
import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ConsentAnalytics } from '@/components/ConsentAnalytics';
import { DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE } from '@/lib/site';
import './globals.css';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hanken',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex-mono',
});

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
    <html lang="en" className={`${hanken.variable} ${plexMono.variable}`}>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <ConsentAnalytics />
      </body>
    </html>
  );
}
