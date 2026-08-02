/* Shared layout for every legal document: title, last-updated date from one
   constant, an anchor-linked table of contents, numbered sections, and a
   footer that says how much of the document is still unwritten.

   The TOC is a real <nav> with an ordered list, so it is navigable by landmark
   as well as by eye, and every entry resolves to a section id. */

import Link from 'next/link';

import { SectionView } from './blocks';
import { countTodos, LAST_UPDATED, type Section } from '@/lib/legal';

export function LegalPage({
  title,
  intro,
  sections,
  notice,
}: {
  title: string;
  intro: string;
  sections: Section[];
  /** The draft banner, when the document has not been reviewed. */
  notice?: React.ReactNode;
}) {
  const todos = countTodos(sections);

  return (
    <div className="section">
      <div className="container legal">
        <header className="legal__head">
          <p className="eyebrow">Legal</p>
          <h1>{title}</h1>
          <p className="mono legal__updated">Last updated {LAST_UPDATED}</p>
          <p className="lead">{intro}</p>
        </header>

        {notice}

        <nav className="legal__toc" aria-label={`${title} contents`}>
          <p className="eyebrow">Contents</p>
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <span className="legal-section__n" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <a href={`#${s.id}`}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal__body">
          {sections.map((s, i) => (
            <SectionView key={s.id} section={s} n={i + 1} />
          ))}
        </div>

        <footer className="legal__foot">
          {todos > 0 ? (
            <p className="mono">
              {todos} section{todos === 1 ? '' : 's'} of this document still need content. They are
              marked <span className="todo__inline">TODO</span> above. Run{' '}
              <code>npm run check:legal</code> for the checklist.
            </p>
          ) : (
            <p className="mono">Every section of this document has content.</p>
          )}
          <p className="muted small">
            See also <Link href="/privacy">Privacy policy</Link>,{' '}
            <Link href="/terms">Terms of service</Link>, <Link href="/support">Support</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
}
