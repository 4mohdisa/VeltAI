import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { DRAFT, TERMS } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of service',
  description:
    'The terms that govern your use of Lumo: what the service does, the health disclaimer, subscriptions billed through Apple, and your rights under Australian Consumer Law.',
  alternates: { canonical: '/terms/' },
};

/* SCAFFOLD, NOT A LEGAL DOCUMENT. See app/privacy/page.tsx. */

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="The agreement between you and Lumo, and the limits of what the app claims to do."
      sections={TERMS}
      notice={
        DRAFT ? (
          <aside className="legal__notice" role="note" aria-label="Draft notice">
            <span className="legal__notice-label">Draft — not legal advice</span>
            <p>
              These terms are a working draft and have not been reviewed by an Australian lawyer.
              The limitation-of-liability and consumer-guarantee provisions in particular are
              unwritten, because Australian Consumer Law guarantees cannot be excluded and a clause
              adapted from a United States template would itself be a risk. Do not rely on this
              document.
            </p>
          </aside>
        ) : null
      }
    />
  );
}
