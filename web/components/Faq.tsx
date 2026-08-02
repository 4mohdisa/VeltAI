/* FAQ list built on native <details>/<summary>.
   No JS, no state, no accordion library: the browser already gives us the
   disclosure semantics, keyboard handling and screen-reader announcement for
   free, and it works before hydration and with JS disabled. The only thing
   worth styling is the marker, which is a rotating hairline cross drawn in CSS
   rather than an icon font or an emoji. */

import type { QA } from '@/lib/faq';

export function Faq({ items }: { items: QA[] }) {
  return (
    <div className="faq">
      {items.map((item) => (
        <details className="faq__item" key={item.q}>
          <summary>
            {item.q}
            <span className="faq__mark" aria-hidden />
          </summary>
          <div className="faq__answer">
            {item.a.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
