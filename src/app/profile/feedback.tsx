// Help and feedback (PHASE3_ROWS.md row 10). A category, a message, and an
// opt-in switch for the app version and device model. Sends only what is shown
// here: no logs, headers, tokens or email.
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';

import { Screen } from '@/components/navigation/Screen';
import { SettingsList } from '@/components/display/SettingsList';
import { showToast } from '@/components/display/toastStore';
import { Button } from '@/components/forms/Button';
import { SegmentedField } from '@/components/forms/SegmentedField';
import { TextField } from '@/components/forms/TextField';
import { api, type FeedbackCategory, type FeedbackInput } from '@/lib/api';
import { VERSION_LABEL } from '@/lib/appVersion';
import { space } from '@/lib/design/tokens';

const MAX_MESSAGE = 2000;
const MAX_FIELD = 64;
const CATEGORIES: FeedbackCategory[] = ['bug', 'idea', 'account', 'other'];
const CATEGORY_KEY = {
  bug: 'feedback.categoryBug',
  idea: 'feedback.categoryIdea',
  account: 'feedback.categoryAccount',
  other: 'feedback.categoryOther',
} as const;

export default function FeedbackScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [message, setMessage] = useState('');
  const [includeDevice, setIncludeDevice] = useState(false);
  const [sending, setSending] = useState(false);

  const trimmed = message.trim();
  const canSend = category !== '' && trimmed.length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    const input: FeedbackInput = { category, message: trimmed };
    if (includeDevice) {
      input.app_version = VERSION_LABEL.slice(0, MAX_FIELD);
      input.device_model = (Device.modelName ?? '').slice(0, MAX_FIELD);
    }
    setSending(true);
    try {
      await api.feedback.post(input);
      showToast({ message: t('feedback.sent'), tone: 'success' });
      router.back();
    } catch {
      showToast({ message: t('feedback.error'), tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen variant="floating" eyebrow={t('settings.supportEyebrow')} title={t('feedback.title')} showBack contentStyle={{ gap: space.xl }}>
      <SegmentedField
        label={t('feedback.categoryLabel')}
        options={CATEGORIES.map((value) => ({ value, label: t(CATEGORY_KEY[value]) }))}
        value={category}
        onChange={setCategory}
        variant="inset"
        compact
      />
      <TextField
        label={t('feedback.messageLabel')}
        placeholder={t('feedback.messagePlaceholder')}
        helper={t('feedback.counter', { count: message.length })}
        value={message}
        onChangeText={setMessage}
        maxLength={MAX_MESSAGE}
        multiline
      />
      <SettingsList
        rows={[
          {
            icon: 'phone-portrait-outline',
            label: t('feedback.includeDevice'),
            accessibilityHint: t('feedback.includeDeviceHint'),
            kind: 'toggle',
            switchValue: includeDevice,
            onToggle: setIncludeDevice,
          },
        ]}
      />
      <Button
        title={t('feedback.send')}
        loading={sending}
        disabled={!canSend}
        onPress={() => void send()}
      />
    </Screen>
  );
}
