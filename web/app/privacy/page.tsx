import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { DRAFT, DRAFT_NOTICE, PRIVACY } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'What Lume collects, including health information; which processors receive it; how it is secured; and how to delete it. A working draft pending legal review.',
  alternates: { canonical: '/privacy/' },
};

/* SCAFFOLD, NOT A LEGAL DOCUMENT. Content lives in lib/legal.ts, where each
   block is explicitly prose, a TODO, or a fact verified against the codebase.
   The section list is checked against legal/manifest.json by
   `npm run check:legal`, which fails while any TODO remains — so a
   half-written policy cannot be quietly deployed as though it were finished. */

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What Lume collects, why, who else sees it, and what you can do about it."
      sections={PRIVACY}
      notice={
        DRAFT ? (
          <aside className="legal__notice" role="note" aria-label="Draft notice">
            <span className="legal__notice-label">Draft — not legal advice</span>
            <p>{DRAFT_NOTICE}</p>
          </aside>
        ) : null
      }
    />
  );
}
