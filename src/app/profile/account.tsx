// E3 · Account settings
// Email (read-only, from Clerk in production), editable display name, an initials
// avatar, and Delete Account in destructive red. Units moved to Preferences (E8) —
// this screen no longer carries a measurement toggle. (No "Change photo": a custom
// avatar needs the native image picker, deferred to a later build — an initials
// avatar is the v1, with no dead "coming soon" affordance.)
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { Avatar } from '@/components/display/Avatar';
import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { space } from '@/lib/design/tokens';
import { useUserProfile } from '@/lib/data';
import { useUserStore } from '@/lib/data/userStore';
import { api } from '@/lib/api';

export default function AccountScreen() {
  const profile = useUserProfile();
  const [name, setName] = useState(profile.name);
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
      showToast({ message: 'Name updated.', tone: 'success' });
    } catch {
      showToast({ message: 'Saved on this device — could not reach the server.', tone: 'warn' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      grouped
      title="Account"
      showBack
      footer={<Button title="Save" onPress={save} disabled={!dirty || saving} loading={saving} />}
    >
      <Card>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <Avatar name={name} size={84} />
        </View>
      </Card>

      <TextField label="Display name" value={name} onChangeText={setName} autoCapitalize="words" />

      <SettingsList rows={[{ icon: 'mail-outline', label: 'Email', value: profile.email, kind: 'plain' }]} />

      <SettingsList
        rows={[
          {
            icon: 'trash-outline',
            label: 'Delete Account',
            destructive: true,
            onPress: () => router.push('/profile/delete-account'),
          },
        ]}
      />
    </Screen>
  );
}
