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

const SUPPORT_EMAIL = 'lumofit@gmail.com';

export default function SupportScreen() {
  const [feedback, setFeedback] = useState('');

  // Feedback goes out as a real email — the compose sheet is the send action;
  // no fake "sent" confirmation for text that went nowhere.
  const sendFeedback = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Lumo feedback')}&body=${encodeURIComponent(feedback)}`;
    Linking.openURL(url)
      .then(() => setFeedback(''))
      .catch(() => showToast({ message: `Couldn't open Mail — email us at ${SUPPORT_EMAIL}.`, tone: 'error' }));
  };

  return (
    <Screen grouped title="Support" showBack>
      <SettingsList
        rows={[
          { icon: 'mail-outline', label: 'Email support', value: SUPPORT_EMAIL, onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {}) },
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
      <Button title="Send feedback" disabled={feedback.trim().length === 0} onPress={sendFeedback} />
    </Screen>
  );
}
