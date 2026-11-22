// E9 · Privacy
// Privacy policy + terms (the in-app documents — no account or network
// needed); product analytics opt-out; data export via the share sheet.
import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { showToast } from '@/components/display/toastStore';
import { api } from '@/lib/api';
import { hasAiConsent, revokeAiConsent } from '@/lib/ai/consent';
import { useSettingsStore } from '@/lib/settings/store';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
  const setAnalyticsEnabled = useSettingsStore((s) => s.setAnalyticsEnabled);
  const [exporting, setExporting] = useState(false);
  const [aiConsent, setAiConsent] = useState<boolean | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    void hasAiConsent().then(setAiConsent);
  }, []);

  // 5.1.2(i): the disclosure copy has always pointed here for withdrawal —
  // pre-audit no such control existed anywhere in the app (audit 2026-08-06).
  const withdrawAiConsent = async () => {
    if (revoking) return;
    setRevoking(true);
    try {
      await revokeAiConsent();
      setAiConsent(false);
      showToast({ message: 'AI processing turned off. Scans and insights are disabled until you turn it back on.', tone: 'success' });
    } catch {
      showToast({ message: "Couldn't reach the server to withdraw consent — try again.", tone: 'error' });
    } finally {
      setRevoking(false);
    }
  };

  // GET /api/export → hand the JSON to the iOS share sheet (save to Files,
  // AirDrop, mail — the user chooses).
  // ponytail: shares the JSON as text — fine for personal data volumes; write
  // to a temp file via expo-file-system if exports ever get huge.
  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await api.profile.export();
      await Share.share({ message: JSON.stringify(data, null, 2) }, { subject: 'Lume data export' });
    } catch {
      showToast({ message: t('settings.exportError'), tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen variant="floating" eyebrow={t('settings.privacyEyebrow')} title={t('settings.privacy')} showBack contentStyle={{ gap: 22 }}>
      <SettingsList
        rows={[
          { icon: 'document-text-outline', label: 'Privacy policy', onPress: () => router.push('/legal/privacy' as Href) },
          { icon: 'reader-outline', label: 'Terms of use', onPress: () => router.push('/legal/terms' as Href) },
        ]}
      />
      <SettingsList
        title={t('settings.analyticsTitle')}
        footer={t('settings.analyticsFooter')}
        rows={[
          {
            icon: 'pulse-outline',
            label: t('settings.analyticsLabel'),
            accessibilityHint: t('settings.analyticsHint'),
            kind: 'toggle',
            switchValue: analyticsEnabled,
            onToggle: setAnalyticsEnabled,
          },
        ]}
      />
      {aiConsent === true ? (
        <SettingsList
          title="AI processing"
          footer="Withdraws your consent for Google Gemini (meal photos) and Anthropic (insight wording). Scanning and AI features stop working until you accept the disclosure again."
          rows={[
            {
              icon: 'sparkles-outline',
              label: revoking ? 'Turning off…' : 'Turn off AI processing',
              onPress: () => void withdrawAiConsent(),
            },
          ]}
        />
      ) : null}
      <SettingsList
        title="Your data"
        footer="Your health data stays private. We never sell it, and we run no advertising or tracking SDKs inside the app."
        rows={[
          {
            icon: 'download-outline',
            label: exporting ? t('settings.exportPreparing') : t('settings.exportTitle'),
            accessibilityHint: t('settings.exportHint'),
            onPress: () => void exportData(),
          },
        ]}
      />
    </Screen>
  );
}
