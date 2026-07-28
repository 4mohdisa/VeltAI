// E9 · Privacy
// Privacy policy + terms (the in-app documents — no account or network
// needed); product analytics opt-out; data export via the share sheet.
import { useState } from 'react';
import { Share } from 'react-native';
import { router, type Href } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { showToast } from '@/components/display/toastStore';
import { Text } from '@/components/primitives/Text';
import { color } from '@/lib/design/tokens';
import { api } from '@/lib/api';
import { useSettingsStore } from '@/lib/settings/store';

export default function PrivacyScreen() {
  const analyticsEnabled = useSettingsStore((s) => s.analyticsEnabled);
  const setAnalyticsEnabled = useSettingsStore((s) => s.setAnalyticsEnabled);
  const [exporting, setExporting] = useState(false);

  // GET /api/export → hand the JSON to the iOS share sheet (save to Files,
  // AirDrop, mail — the user chooses).
  // ponytail: shares the JSON as text — fine for personal data volumes; write
  // to a temp file via expo-file-system if exports ever get huge.
  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await api.profile.export();
      await Share.share({ message: JSON.stringify(data, null, 2) }, { subject: 'Lumo data export' });
    } catch {
      showToast({ message: "Couldn't export your data — check your connection and try again.", tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen grouped title="Privacy" showBack>
      <SettingsList
        rows={[
          { icon: 'document-text-outline', label: 'Privacy policy', onPress: () => router.push('/legal/privacy' as Href) },
          { icon: 'reader-outline', label: 'Terms of use', onPress: () => router.push('/legal/terms' as Href) },
        ]}
      />
      <SettingsList
        title="Analytics"
        rows={[
          {
            icon: 'pulse-outline',
            label: 'Product analytics',
            kind: 'toggle',
            switchValue: analyticsEnabled,
            onToggle: setAnalyticsEnabled,
          },
        ]}
      />
      <Text variant="footnote" color={color.gray500}>
        First-party only, on our own servers — which features are used, never what you log. Never
        sold. Off means fully off.
      </Text>
      <SettingsList
        title="Your data"
        rows={[
          {
            icon: 'download-outline',
            label: exporting ? 'Preparing your export…' : 'Export my data',
            onPress: () => void exportData(),
          },
        ]}
      />
      <Text variant="footnote" color={color.gray500}>
        Your health data stays private. We never sell it, and we run no advertising or tracking SDKs
        inside the app.
      </Text>
    </Screen>
  );
}
