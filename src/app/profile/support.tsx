// E10 · Support
// Email support, FAQ link, app version, and a feedback textarea that goes to the
// team. Veltai has NO in-app rating/review prompts at all (no SKStoreReview).
import { useState } from 'react';
import { Linking } from 'react-native';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';

export default function SupportScreen() {
  const [feedback, setFeedback] = useState('');

  return (
    <Screen grouped title="Support" showBack>
      <SettingsList
        rows={[
          { icon: 'mail-outline', label: 'Email support', value: 'lumofit@gmail.com', onPress: () => Linking.openURL('mailto:lumofit@gmail.com').catch(() => {}) },
          { icon: 'help-circle-outline', label: 'FAQ', onPress: () => Linking.openURL('https://veltai.app/support').catch(() => {}) },
          { icon: 'information-circle-outline', label: 'App version', value: '1.0.0', kind: 'plain' },
        ]}
      />

      <TextField
        label="Send feedback"
        placeholder="Tell us what's working or what's not."
        value={feedback}
        onChangeText={setFeedback}
        multiline
      />
      <Button
        title="Send feedback"
        disabled={feedback.trim().length === 0}
        onPress={() => {
          setFeedback('');
          showToast({ message: 'Thanks — feedback sent.', tone: 'success' });
        }}
      />
    </Screen>
  );
}
