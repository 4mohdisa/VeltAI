/* The two content treatments, and the layout that hosts them.
   ==========================================================================

   <Todo> is the important one. A placeholder that reads as prose is a trap: a
   reader — including the person who has to replace it — skims and assumes the
   document is finished. So it is a hairline-boxed, monospaced block with a
   TODO label, in the site's own design language: no glow, no yellow, no
   warning triangle, nothing borrowed from a different system. It should look
   deliberate and unfinished at the same time.

   <Verified> is the opposite: a fact read out of the codebase, safe to keep.
   It is styled almost invisibly — a hairline on the leading edge — because it
   is meant to read as part of the document. Its provenance is emitted as an
   HTML comment so `view-source` and grep can find it without the page
   carrying footnote clutter. */

import type { Block, Section } from '@/lib/legal';

export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <div className="todo" role="note">
      <span className="todo__label" aria-hidden />
      <p className="todo__body">{children}</p>
    </div>
  );
}

/** Provenance goes into an HTML comment, never into rendered text. */
function SourceComment({ source }: { source: string }) {
  return <span dangerouslySetInnerHTML={{ __html: `<!-- VERIFIED FROM: ${source} -->` }} />;
}

export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p>{block.text}</p>;

    case 'list':
      return (
        <ul className="legal-list">
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );

    case 'todo':
      return <Todo>{block.text}</Todo>;

    case 'verified':
      return (
        <div className="verified">
          <SourceComment source={block.source} />
          <p>{block.text}</p>
        </div>
      );

    case 'verifiedList':
      return (
        <div className="verified">
          <SourceComment source={block.source} />
          <p>{block.lead}</p>
          <ul className="legal-list">
            {block.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      );
  }
}

export function SectionView({ section, n }: { section: Section; n: number }) {
  return (
    <section id={section.id} className="legal-section" aria-labelledby={`${section.id}-h`}>
      <h2 id={`${section.id}-h`}>
        <span className="legal-section__n" aria-hidden>
          {String(n).padStart(2, '0')}
        </span>
        {section.heading}
      </h2>
      <div className="legal-section__body">
        {section.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
    </section>
  );
}
