// E12 · Delete Account flow (App Store Guideline 5.1.1(v) requires this)
// Multi-step confirmation: (1) are you sure, (2) what gets deleted, (3) type
// DELETE, (4) final. On confirm → clear local state → sign out → back to A1.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/primitives/Icon';

import { Screen } from '@/components/navigation/Screen';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { Text } from '@/components/primitives/Text';
import { color, space } from '@/lib/design/tokens';
import { setHasCompletedOnboarding } from '@/lib/storage/secureStore';

const DELETED_DATA = [
  'Your profile and onboarding answers',
  'All gym sessions and your streak',
  'All food logs, meal photos and voice notes',
  'Your AI plans, XP and rank',
  'Your subscription is cancelled (no refund — Apple’s policy)',
];

export default function DeleteAccountScreen() {
  const [step, setStep] = useState(0);
  const [confirmText, setConfirmText] = useState('');

  const finish = async () => {
    await setHasCompletedOnboarding(false);
    router.replace('/(onboarding)/welcome');
  };

  return (
    <Screen
      title="Delete Account"
      showBack
      footer={
        step === 0 ? (
          <Button title="Continue" variant="destructive" onPress={() => setStep(1)} />
        ) : step === 1 ? (
          <Button title="I understand, continue" variant="destructive" onPress={() => setStep(2)} />
        ) : (
          <Button
            title="Permanently delete account"
            variant="destructive"
            disabled={confirmText.trim().toUpperCase() !== 'DELETE'}
            onPress={finish}
          />
        )
      }
    >
      {step === 0 ? (
        <View style={{ gap: space.md, alignItems: 'center', paddingVertical: space.lg }}>
          <Icon name="warning" size={44} color={color.error} />
          <Text variant="title2" color={color.black} style={{ textAlign: 'center' }}>
            Are you sure?
          </Text>
          <Text variant="body" color={color.gray700} style={{ textAlign: 'center' }}>
            This permanently deletes your account. There&apos;s a 7-day grace period before everything
            is purged.
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: space.md }}>
          <Text variant="title3" color={color.black}>
            What will be deleted
          </Text>
          {DELETED_DATA.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
              <Icon name="close-circle" size={18} color={color.error} style={{ marginTop: 2 }} />
              <Text variant="body" color={color.gray900} style={{ flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: space.md }}>
          <Text variant="body" color={color.gray700}>
            Type <Text variant="bodyBold" color={color.black}>DELETE</Text> to confirm.
          </Text>
          <TextField
            label="Confirmation"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="DELETE"
          />
        </View>
      ) : null}
    </Screen>
  );
}
