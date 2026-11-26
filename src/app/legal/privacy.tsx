// Privacy Policy (in-app). Every heading and paragraph comes from
// legal.privacy in en.json (English only for now).
//
// The SECTION LIST is canonical and lives in legal/manifest.json — the same
// contract the website implements. src/__tests__/legalParity.test.ts fails if
// the keys below, their headings in en.json and the manifest drift apart. See
// DECISIONS.md for why the content is duplicated rather than shared.
//
// Sections marked `pending` are awaiting a lawyer. They render inside a
// bordered PENDING block, opened by the drafting notice, so they cannot read
// as finished text.
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { LegalScreen, type LegalSection } from '@/components/navigation/LegalScreen';

const UPDATED = '25 November 2026';

const SECTIONS: { key: string; pending?: boolean }[] = [
  { key: 'whoWeAre', pending: true },
  { key: 'scope', pending: true },
  { key: 'whatWeCollect' },
  { key: 'sensitiveConsent', pending: true },
  { key: 'purposes' },
  { key: 'disclosure' },
  { key: 'overseas', pending: true },
  { key: 'security' },
  { key: 'accessCorrection' },
  { key: 'deletion' },
  { key: 'complaints', pending: true },
  { key: 'analytics' },
  { key: 'children', pending: true },
  { key: 'changes', pending: true },
  { key: 'contact', pending: true },
];

export default function PrivacyPolicyScreen(): JSX.Element {
  const { t } = useTranslation();
  const sections: LegalSection[] = SECTIONS.map(({ key, pending }) => {
    const body = t(`legal.privacy.sections.${key}.body`, { returnObjects: true }) as string[];
    return {
      heading: t(`legal.privacy.sections.${key}.heading`),
      pending,
      body: pending ? [t('legal.privacy.awaiting'), ...body] : body,
    };
  });
  return (
    <LegalScreen title={t('legal.privacy.title')} updated={UPDATED} intro={t('legal.privacy.intro')} sections={sections} />
  );
}
