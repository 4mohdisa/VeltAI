// E3 · Account settings
// Email (read-only, from Clerk in production), editable display name, an initials
// avatar, and Delete Account in destructive red. Units moved to Preferences (E8) —
// this screen no longer carries a measurement toggle. (No "Change photo": a custom
// avatar needs the native image picker, deferred to a later build — an initials
// avatar is the v1, with no dead "coming soon" affordance.)
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { Avatar } from '@/components/display/Avatar';
import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { useUserProfile } from '@/lib/data';
import { useUserStore } from '@/lib/data/userStore';
import { api } from '@/lib/api';

export default function AccountScreen() {
  const { t } = useTranslation();
  const profile = useUserProfile();
  // The profile can land after mount; until the user types, the field follows it.
  const [draft, setName] = useState<string | null>(null);
  const name = draft ?? profile.name;
  const [saving, setSaving] = useState(false);
  const dirty = name.trim().length > 0 && name.trim() !== profile.name;

  // Persist the display name (AUDIT_REPORT.md M7): update the local store
  // immediately (drives the avatar) and push to the backend best-effort.
  const save = async () => {
    setSaving(true);
    const next = name.trim();
    useUserStore.getState().setProfile({ name: next });
    try {
      await api.profile.update({ display_name: next });
      showToast({ message: t('settings.accountDetails.nameUpdated'), tone: 'success' });
    } catch {
      showToast({ message: t('settings.accountDetails.savedOffline'), tone: 'warn' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      variant="floating"
      eyebrow={t('settings.accountEyebrow')}
      title={t('settings.account')}
      showBack contentStyle={{ gap: space.xl }}
      footer={<Button title={t('common.save')} onPress={save} disabled={!dirty || saving} loading={saving} />}
    >
      {/* Identity card — the design's elevated header. It shows only what the
          app actually knows: the avatar and the name being edited. Member-since
          and days-logged are in UI_PASS_GAPS.md (no source). */}
      <Card variant="elevated">
        <View style={{ alignItems: 'center', gap: space.md }}>
          <Avatar name={name} size={84} />
          {name.trim() ? (
            <Text variant="statMedium" color={color.label} numberOfLines={1}>
              {name}
            </Text>
          ) : null}
        </View>
      </Card>

      <TextField label={t('settings.accountDetails.displayName')} value={name} onChangeText={setName} autoCapitalize="words" />
      <View style={{ gap: space.xs }}>
        <SettingsList rows={[{ icon: 'mail-outline', label: t('settings.accountDetails.email'), value: profile.email, kind: 'plain' }]} />

        <SettingsList
          rows={[
            {
              icon: 'trash-outline',
              label: t('settings.accountDetails.deleteAccount'),
              destructive: true,
              onPress: () => router.push('/profile/delete-account'),
            },
          ]}
        />
      </View>
    </Screen>
  );
}
