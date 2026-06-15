// E3 · Account settings
// Email (read-only, from Clerk in production), editable display name, avatar
// picker (placeholder), units toggle, and Delete Account in destructive red.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/navigation/Screen';
import { Avatar } from '@/components/display/Avatar';
import { Card } from '@/components/display/Card';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { space } from '@/lib/design/tokens';
import { mockUser } from '@/lib/mock/data';

export default function AccountScreen() {
  const [name, setName] = useState(mockUser.name);
  const [units, setUnits] = useState<'metric' | 'imperial'>(mockUser.units);

  return (
    <Screen title="Account" showBack>
      <Card>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <Avatar name={name} size={84} />
          <Button
            title="Change photo"
            variant="tertiary"
            fullWidth={false}
            onPress={() => showToast({ message: 'Photo picker coming soon.', tone: 'info' })}
          />
        </View>
      </Card>

      <TextField label="Display name" value={name} onChangeText={setName} autoCapitalize="words" />

      <SettingsList rows={[{ icon: 'mail-outline', label: 'Email', value: mockUser.email, kind: 'plain' }]} />

      <SegmentedField
        label="Units"
        value={units}
        onChange={setUnits}
        options={[
          { label: 'Metric', value: 'metric' },
          { label: 'Imperial', value: 'imperial' },
        ]}
      />

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
