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
import { TextField } from '@/components/forms/TextField';
import { space } from '@/lib/design/tokens';
import { useUserProfile } from '@/lib/data';

export default function AccountScreen() {
  const profile = useUserProfile();
  const [name, setName] = useState(profile.name);

  return (
    <Screen grouped title="Account" showBack>
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
