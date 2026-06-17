// i18n setup — i18next + react-i18next (pure JS, no native module). English is
// the full source locale; Spanish is a complete translation of the migrated
// keys; French is intentionally partial to prove fallback-to-English works.
//
// Device language is detected via Hermes Intl (no expo-localization needed) and
// used as the default; the Preferences language picker overrides it at runtime.
import i18next from 'i18next';
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

function deviceLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g. "es-ES"
    const code = locale.split('-')[0];
    return SUPPORTED_LANGUAGES.some((l) => l.code === code) ? code : 'en';
  } catch {
    return 'en';
  }
}

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    resources,
    lng: deviceLanguage(),
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: { escapeValue: false }, // RN has no XSS surface
    returnNull: false,
  });
}

export default i18next;
