// E10 · Support
// Email support, FAQ link, app version, and a feedback textarea that goes to the
// team. Lume has NO in-app rating/review prompts at all (no SKStoreReview).
import { useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { Button } from '@/components/forms/Button';
import { TextField } from '@/components/forms/TextField';
import { showToast } from '@/components/display/toastStore';
import { VERSION_LABEL } from '@/lib/appVersion';
import { space } from '@/lib/design/tokens';

const SUPPORT_EMAIL = 'lumofit@gmail.com';

export default function SupportScreen() {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');

  // Feedback goes out as a real email — the compose sheet is the send action;
  // no fake "sent" confirmation for text that went nowhere.
  const sendFeedback = () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('support.mailSubject'))}&body=${encodeURIComponent(feedback)}`;
    Linking.openURL(url)
      .then(() => setFeedback(''))
      .catch(() => showToast({ message: t('support.mailError', { email: SUPPORT_EMAIL }), tone: 'error' }));
  };

  return (
    <Screen variant="floating" eyebrow={t('settings.supportEyebrow')} title={t('settings.support')} showBack contentStyle={{ gap: space.xl }}>
      <SettingsList
        rows={[
          { icon: 'mail-outline', label: t('support.emailSupport'), value: SUPPORT_EMAIL, onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {}) },
          { icon: 'information-circle-outline', label: t('support.appVersion'), value: VERSION_LABEL, kind: 'plain' },
        ]}
      />

      <TextField
        label={t('support.sendFeedback')}
        placeholder={t('support.feedbackPlaceholder')}
        value={feedback}
        onChangeText={setFeedback}
        multiline
      />
      <Button title={t('support.sendFeedback')} disabled={feedback.trim().length === 0} onPress={sendFeedback} />
    </Screen>
  );
}
