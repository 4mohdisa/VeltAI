// Terms of Service (in-app). Every heading and paragraph comes from
// legal.terms in en.json (English only for now, except the health disclaimer,
// which is translated).
//
// Section list is canonical in legal/manifest.json; src/__tests__/legalParity.test.ts
// enforces it against this file, en.json and the website. See DECISIONS.md.
//
// NOTE ON PRICES: this screen previously stated "US$8.99 per month or US$49.99
// per year". Those figures appear in NO code and in NO configured App Store
// product — they were invented. They are gone. Apple shows the real price
// before purchase, which is both accurate and what Apple requires.
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { LegalScreen, type LegalSection } from '@/components/navigation/LegalScreen';
import { TRIAL_DAYS } from '@/lib/billing/purchases';

const UPDATED = '25 November 2026';

const SECTIONS: { key: string; pending?: boolean }[] = [
  { key: 'acceptance' },
  { key: 'whoWeAre', pending: true },
  { key: 'eligibility', pending: true },
  { key: 'theService' },
  { key: 'healthDisclaimer' },
  { key: 'subscriptions' },
  { key: 'freeTier' },
  { key: 'acceptableUse', pending: true },
  { key: 'userContent', pending: true },
  { key: 'intellectualProperty', pending: true },
  { key: 'thirdParties' },
  { key: 'liability', pending: true },
  { key: 'termination' },
  { key: 'changes' },
  { key: 'governingLaw' },
  { key: 'contact', pending: true },
];

export default function TermsScreen(): JSX.Element {
  const { t } = useTranslation();
  const d = (k: string) => t(`legal.terms.healthDisclaimer.${k}`);
  const disclaimer = [
    `${d('notMedicalAdvice')} ${d('notMedicalDevice')}`,
    `${d('consultProfessional')} ${d('neverDisregard')}`,
    d('emergency'),
    `${d('targetsFormulas')} ${d('targetsStartingPoint')} ${d('ownRisk')}`,
  ];
  const sections: LegalSection[] = SECTIONS.map(({ key, pending }) => ({
    heading: t(`legal.terms.sections.${key}.heading`),
    pending,
    body:
      key === 'healthDisclaimer'
        ? disclaimer
        : (t(`legal.terms.sections.${key}.body`, {
            returnObjects: true,
            awaiting: t('legal.terms.awaiting'),
            trialDays: TRIAL_DAYS,
          }) as string[]),
  }));
  return <LegalScreen title={t('legal.terms.title')} updated={UPDATED} intro={t('legal.terms.intro')} sections={sections} />;
}
