import type { Metadata } from 'next';

import { Faq } from '@/components/Faq';
import { ALL } from '@/lib/faq';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Honest answers about Lumo: how accurate photo calorie estimates really are, how scanning works, what leaves your phone, what it costs, and what it does not do yet.',
  alternates: { canonical: '/faq/' },
};

/* Content lives in lib/faq.ts so this page and the home page cannot drift.
   The previous version of this page carried five claims the app does not
   support. Two mattered: it said Lumo syncs with Apple Health (there is no
   HealthKit integration of any kind — the seam in the app is a null module
   whose only importer is its own unit test), and it said every result shows a
   calorie RANGE (nothing in the app computes or displays an interval). It also
   printed specific subscription prices that appear in no code and in no
   configured App Store product, and described a per-ingredient clarification
   prompt — "whether the curry has coconut cream" — that does not exist. */

export default function FaqPage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <div className="head">
            <p className="eyebrow">Questions</p>
            <h1>Frequently asked questions</h1>
            <p className="lead">
              Including the awkward ones. If something here is unclear or looks wrong, say so — the
              whole product is an argument for admitting what you do not know.
            </p>
          </div>
          <div style={{ maxWidth: 'var(--measure)' }}>
            <Faq items={ALL} />
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: ALL.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a.join(' ') },
            })),
          }),
        }}
      />
    </>
  );
}
