// i18n setup — i18next + react-i18next (pure JS, no native module). English is
// the source locale; Spanish and French carry every English key, with matching
// placeholders and plurals, as src/__tests__/localeParity.test.ts enforces.
//
// The app starts in English (lng below) and nothing switches language yet;
// deviceLanguage() reads the device locale via Hermes Intl for when a picker returns.
import i18next, { use as addPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

export const SUPPORTED_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
} as const;

export function deviceLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g. "es-ES"
    const code = locale.split('-')[0];
    return SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : 'en';
  } catch {
    return 'en';
  }
}

if (!i18next.isInitialized) {
  void addPlugin(initReactI18next).init({
    resources,
    // English-only at launch (the picker was removed). The es/fr resources +
    // deviceLanguage() helper stay in the scaffolding for when the picker returns.
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: { escapeValue: false }, // RN has no XSS surface
    returnNull: false,
  });
}

export default i18next;
